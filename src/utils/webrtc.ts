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
    // 1. Get local stream FIRST. This is the critical fix.
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      // Do not throw error, allow user to join with video off
      this.localStream = null;
    }

    // 2. Now that the stream is ready, initialize signaling.
    this.roomChannel = supabase.channel(`room:${roomId}`);

    this.roomChannel
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        console.log('New peer joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        console.log('Peer left:', key);
        leftPresences.forEach((presence: any) => {
          this.removePeer(presence.userId);
          this.onPeerLeft();
        });
      })
      .on('presence', { event: 'sync' }, () => {
        const presences = this.roomChannel.presenceState();
        for (const id in presences) {
          const presence = presences[id][0];
          if (presence.userId !== this.userId) {
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
          await this.roomChannel.track({ userId: this.userId });
        }
      });
      
    // 3. Return the stream for the UI to use.
    return this.localStream;
  }

  public async toggleVideo(enable: boolean): Promise<MediaStream | null> {
    if (enable) {
      // Turn video ON
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        // For each existing peer connection, replace or add tracks and renegotiate
        for (const [peerId, { connection }] of this.peers.entries()) {
          // Remove existing video senders
          connection.getSenders().forEach(sender => {
            if (sender.track && sender.track.kind === 'video') {
              connection.removeTrack(sender);
            }
          });
          // Add new video tracks
          this.localStream.getVideoTracks().forEach(track => {
            connection.addTrack(track, this.localStream!);
          });
          // Trigger renegotiation for this peer
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
        throw error; // Re-throw to be caught by VideoGrid
      }
    } else {
      // Turn video OFF
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // For each existing peer connection, remove tracks and renegotiate
      for (const [peerId, { connection }] of this.peers.entries()) {
        connection.getSenders().forEach(sender => {
          if (sender.track && sender.track.kind === 'video') {
            connection.removeTrack(sender);
          }
        });
        // Trigger renegotiation for this peer (to signal video is off)
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

    if (this.localStream) { // Only add tracks if localStream exists
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