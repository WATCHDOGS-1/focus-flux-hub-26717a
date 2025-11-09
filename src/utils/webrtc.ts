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
  private onPeerLeft: (peerId: string) => void; // Changed to pass peerId
  private userStatus: string = 'focusing'; // Default status

  constructor(
    userId: string,
    onStreamAdded: (peerId: string, stream: MediaStream) => void,
    onStreamRemoved: (peerId: string) => void,
    onPeerLeft: (peerId: string) => void // Changed to pass peerId
  ) {
    this.userId = userId;
    this.onStreamAdded = onStreamAdded;
    this.onStreamRemoved = onStreamRemoved;
    this.onPeerLeft = onPeerLeft;
  }

  public setUserStatus(status: string) {
    this.userStatus = status;
    if (this.roomChannel && this.roomChannel.is  'SUBSCRIBED') {
      this.roomChannel.track({ userId: this.userId, status: this.userStatus });
    }
  }

  async initialize(roomId: string) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      this.localStream = null;
    }

    this.roomChannel = supabase.channel(`room:${roomId}`);

    this.roomChannel
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        console.log('New peer joined:', key, newPresences);
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
          this.onPeerLeft(presence.userId); // Pass peerId to callback
        });
      })
      .on('presence', { event: 'sync' }, () => {
        const presences = this.roomChannel.presenceState();
        for (const id in presences) {
          const presence = presences[id][0];
          if (presence.userId !== this.userId && !this.peers.has(presence.userId)) {
            this.createPeerConnection(presence.userId, true);
          }
        }
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
          await this.roomChannel.track({ userId: this.userId, status: this.userStatus });
        }
      });
      
    return this.localStream;
  }

  public async toggleVideo(enable: boolean): Promise<MediaStream | null> {
    if (enable) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        for (const [peerId, { connection }] of this.peers.entries()) {
          connection.getSenders().forEach(sender => {
            if (sender.track && sender.track.kind === 'video') {
              connection.removeTrack(sender);
            }
          });
          this.localStream.getVideoTracks().forEach(track => {
            connection.addTrack(track, this.localStream!);
          });
          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
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
        return this.localStream;
      } catch (error) {
        console.error('Error accessing media devices for re-enable:', error);
        throw error;
      }
    } else {
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      for (const [peerId, { connection }] of this.peers.entries()) {
        connection.getSenders().forEach(sender => {
          if (sender.track && sender.track.kind === 'video') {
            connection.removeTrack(sender);
          }
        });
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
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
      return null;
    }
  }

  private async createPeerConnection(peerId: string, createOffer: boolean) {
    if (this.peers.has(peerId)) {
      console.log("Connection with peer already exists:", peerId);
      return;
    }

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

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

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.peers.forEach((peer) => {
      peer.connection.close();
    });
    this.peers.clear();
    if (this.roomChannel) {
      this.roomChannel.unsubscribe();
    }
  }
}