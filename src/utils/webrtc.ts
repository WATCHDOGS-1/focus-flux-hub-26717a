import { supabase } from "@/integrations/supabase/client";

export interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peers: Map<string, PeerConnection> = new Map();
  private roomChannel: any = null;
  private userId: string;
  private onStreamAdded: (peerId: string, stream: MediaStream) => void;
  private onStreamRemoved: (peerId: string) => void;

  constructor(
    userId: string,
    onStreamAdded: (peerId: string, stream: MediaStream) => void,
    onStreamRemoved: (peerId: string) => void
  ) {
    this.userId = userId;
    this.onStreamAdded = onStreamAdded;
    this.onStreamRemoved = onStreamRemoved;
  }

  async initialize(roomId: string) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }

    // Create a unique channel for this room
    this.roomChannel = supabase.channel(`room_${roomId}`, {
      config: {
        presence: {
          key: this.userId,
        },
      },
    });

    // Handle new users joining
    this.roomChannel.on('presence', { event: 'join' }, (payload: any) => {
      payload.newPresences.forEach((presence: any) => {
        if (presence.user_id !== this.userId) {
          this.initiateConnection(presence.user_id);
        }
      });
    });

    // Handle users leaving
    this.roomChannel.on('presence', { event: 'leave' }, (payload: any) => {
      payload.leftPresences.forEach((presence: any) => {
        this.removePeer(presence.user_id);
      });
    });

    // Handle WebRTC signaling messages
    this.roomChannel.on('broadcast', { event: 'signal' }, async (payload: any) => {
      if (payload.payload.to !== this.userId) return;
      
      const { from, signal } = payload.payload;
      if (signal.type === 'offer') {
        await this.handleOffer(from, signal);
      } else if (signal.type === 'answer') {
        await this.handleAnswer(from, signal);
      } else if (signal.type === 'candidate') {
        await this.handleIceCandidate(from, signal.candidate);
      }
    });

    // Subscribe to the channel
    await this.roomChannel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        // Announce our presence in the room
        await this.roomChannel.track({ user_id: this.userId });
        
        // Connect to existing users
        const presenceState = this.roomChannel.presenceState();
        Object.keys(presenceState).forEach((key) => {
          const presence = presenceState[key][0];
          if (presence.user_id !== this.userId) {
            this.initiateConnection(presence.user_id);
          }
        });
      }
    });

    return this.localStream;
  }

  public toggleVideo(enable: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enable;
      });
    }
  }

  public toggleAudio(enable: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enable;
      });
    }
  }

  private async initiateConnection(peerId: string) {
    // Prevent duplicate connections
    if (this.peers.has(peerId)) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local stream tracks to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming media streams
    pc.ontrack = (event) => {
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
        this.sendSignal(peerId, { type: 'candidate', candidate: event.candidate });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.removePeer(peerId);
      }
    };

    // Store the peer connection
    this.peers.set(peerId, { peerId, connection: pc });

    // Create offer for new connections
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendSignal(peerId, { type: 'offer', sdp: offer.sdp });
    } catch (error) {
      console.error('Error creating offer:', error);
      this.removePeer(peerId);
    }
  }

  private async handleOffer(peerId: string, offer: any) {
    // Create connection if it doesn't exist
    if (!this.peers.has(peerId)) {
      await this.initiateConnection(peerId);
    }

    const peerConn = this.peers.get(peerId);
    if (!peerConn) return;

    try {
      await peerConn.connection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConn.connection.createAnswer();
      await peerConn.connection.setLocalDescription(answer);
      this.sendSignal(peerId, { type: 'answer', sdp: answer.sdp });
    } catch (error) {
      console.error('Error handling offer:', error);
      this.removePeer(peerId);
    }
  }

  private async handleAnswer(peerId: string, answer: any) {
    const peerConn = this.peers.get(peerId);
    if (!peerConn) return;

    try {
      await peerConn.connection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      this.removePeer(peerId);
    }
  }

  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidate) {
    const peerConn = this.peers.get(peerId);
    if (!peerConn) return;

    try {
      await peerConn.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  private sendSignal(to: string, signal: any) {
    this.roomChannel.send({
      type: 'broadcast',
      event: 'signal',
      payload: { from: this.userId, to, signal }
    });
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
    // Stop all tracks in the local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peers.forEach(peer => {
      peer.connection.close();
      this.onStreamRemoved(peer.peerId);
    });
    this.peers.clear();

    // Unsubscribe from the channel
    if (this.roomChannel) {
      this.roomChannel.unsubscribe();
    }
  }
}