import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
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
    this.roomChannel = supabase.channel(`room_${roomId}`);

    // Handle WebRTC signaling messages
    this.roomChannel.on('broadcast', { event: 'signal' }, async (payload: any) => {
      const { from, signal } = payload.payload;
      if (from === this.userId) return;
      
      if (signal.type === 'offer') {
        await this.handleOffer(from, signal);
      } else if (signal.type === 'answer') {
        await this.handleAnswer(from, signal);
      } else if (signal.type === 'candidate') {
        await this.handleIceCandidate(from, signal.candidate);
      }
    });

    // Handle presence changes
    this.roomChannel.on('presence', { event: 'join' }, (payload: any) => {
      payload.newPresences.forEach((presence: any) => {
        if (presence.user_id !== this.userId) {
          // When a new user joins, create a connection to them
          this.createPeerConnection(presence.user_id);
        }
      });
    });

    this.roomChannel.on('presence', { event: 'leave' }, (payload: any) => {
      payload.leftPresences.forEach((presence: any) => {
        this.removePeer(presence.user_id);
      });
    });

    // Subscribe to the channel
    await this.roomChannel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        // Announce our presence in the room
        await this.roomChannel.track({ user_id: this.userId });
        
        // Connect to existing users
        const presenceState = this.roomChannel.presenceState();
        for (const key in presenceState) {
          const presence = presenceState[key][0];
          if (presence.user_id !== this.userId) {
            this.createPeerConnection(presence.user_id);
          }
        }
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

  private createPeerConnection(peerId: string) {
    // Prevent duplicate connections
    if (this.peers.has(peerId)) {
      return;
    }

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
        this.remoteStreams.set(peerId, event.streams[0]);
        this.onStreamAdded(peerId, event.streams[0]);
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
    this.peers.set(peerId, pc);

    return pc;
  }

  private async handleOffer(peerId: string, offer: any) {
    const pc = this.createPeerConnection(peerId) || this.peers.get(peerId);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendSignal(peerId, { type: 'answer', sdp: answer.sdp });
    } catch (error) {
      console.error('Error handling offer:', error);
      this.removePeer(peerId);
    }
  }

  private async handleAnswer(peerId: string, answer: any) {
    const pc = this.peers.get(peerId);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      this.removePeer(peerId);
    }
  }

  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidate) {
    const pc = this.peers.get(peerId);
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  private async sendSignal(to: string, signal: any) {
    if (this.roomChannel) {
      this.roomChannel.send({
        type: 'broadcast',
        event: 'signal',
        payload: { from: this.userId, to, signal }
      });
    }
  }

  private removePeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
    
    const stream = this.remoteStreams.get(peerId);
    if (stream) {
      this.remoteStreams.delete(peerId);
      this.onStreamRemoved(peerId);
    }
  }

  cleanup() {
    // Stop all tracks in the local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peers.forEach((pc, peerId) => {
      pc.close();
      this.onStreamRemoved(peerId);
    });
    this.peers.clear();
    this.remoteStreams.clear();

    // Unsubscribe from the channel
    if (this.roomChannel) {
      this.roomChannel.unsubscribe();
    }
  }
}