import { supabase } from "@/integrations/supabase/client";

export interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peers: Map<string, PeerConnection> = new Map();
  private roomChannel: any = null;
  private userId: string;
  private onStreamAdded: (peerId: string, stream: MediaStream) => void;
  private onStreamRemoved: (peerId: string) => void;
  private onPeerLeft: () => void;

  constructor(
    userId: string,
    onStreamAdded: (peerId: string, stream: MediaStream) => void,
    onStreamRemoved: (peerId: string) => void,
    onPeerLeft: () => void
  ) {
    this.userId = userId;
    this.onStreamAdded = onStreamAdded;
    this.onStreamRemoved = onStreamRemoved;
    this.onPeerLeft = onPeerLeft;
  }

  async initialize(roomId: string) {
    // Join the room channel
    this.roomChannel = supabase.channel(`room:${roomId}`);

    // Listen for new peers joining
    this.roomChannel
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        console.log('New peer joined:', key);
        newPresences.forEach((presence: any) => {
          if (presence.userId !== this.userId) {
            this.createPeerConnection(presence.userId, true);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        console.log('Peer left:', key);
        leftPresences.forEach((presence: any) => {
          this.removePeer(presence.userId);
          this.onPeerLeft();
        });
      })
      .on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
        if (payload.to === this.userId) {
          await this.handleOffer(payload.from, payload.offer);
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
        if (payload.to === this.userId) {
          await this.handleAnswer(payload.from, payload.answer);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
        if (payload.to === this.userId) {
          await this.handleIceCandidate(payload.from, payload.candidate);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.roomChannel.track({ userId: this.userId });
        }
      });
  }

  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  private async createPeerConnection(peerId: string, createOffer: boolean) {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming streams
    pc.ontrack = (event) => {
      console.log('Received remote track from', peerId);
      if (event.streams && event.streams[0]) {
        this.onStreamAdded(peerId, event.streams[0]);
        const peerConn = this.peers.get(peerId);
        if (peerConn) {
          peerConn.stream = event.streams[0];
        }
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.roomChannel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            from: this.userId,
            to: peerId,
            candidate: event.candidate,
          },
        });
      }
    };

    this.peers.set(peerId, { peerId, connection: pc });

    // Create offer if we're the initiator
    if (createOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      this.roomChannel.send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          from: this.userId,
          to: peerId,
          offer: offer,
        },
      });
    }
  }

  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    let peerConn = this.peers.get(peerId);
    
    if (!peerConn) {
      await this.createPeerConnection(peerId, false);
      peerConn = this.peers.get(peerId);
    }

    if (!peerConn) return;

    await peerConn.connection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConn.connection.createAnswer();
    await peerConn.connection.setLocalDescription(answer);

    this.roomChannel.send({
      type: 'broadcast',
      event: 'answer',
      payload: {
        from: this.userId,
        to: peerId,
        answer: answer,
      },
    });
  }

  private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const peerConn = this.peers.get(peerId);
    if (!peerConn) return;

    await peerConn.connection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const peerConn = this.peers.get(peerId);
    if (!peerConn) return;

    await peerConn.connection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private removePeer(peerId: string) {
    const peerConn = this.peers.get(peerId);
    if (peerConn) {
      peerConn.connection.close();
      this.onStreamRemoved(peerId);
      this.peers.delete(peerId);
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  cleanup() {
    this.stopLocalStream();
    this.peers.forEach((peer) => {
      peer.connection.close();
    });
    this.peers.clear();
    if (this.roomChannel) {
      this.roomChannel.unsubscribe();
    }
  }
}
