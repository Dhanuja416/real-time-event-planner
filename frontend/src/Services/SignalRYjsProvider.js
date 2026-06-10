import * as Y from 'yjs';
import { Observable } from 'lib0/observable';

export class SignalRYjsProvider extends Observable {
  constructor(hubConnection, documentId, ydoc, awareness) {
    super();
    this.hubConnection = hubConnection;
    this.documentId = documentId;
    this.ydoc = ydoc;
    this.awareness = awareness;
    this.connected = false;

    // Helper to convert incoming data to Uint8Array
    this._convertToUint8Array = (data) => {
      if (data instanceof Uint8Array) return data;
      if (data instanceof ArrayBuffer) return new Uint8Array(data);
      if (typeof data === 'string') {
        const binaryString = window.atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
      if (Array.isArray(data)) {
        return new Uint8Array(data);
      }
      return new Uint8Array(0);
    };

    // 1. Listen for local Y.js document updates and send them to the hub
    this._onDocUpdate = (update, origin) => {
      // Only broadcast if the update was generated locally (origin !== this)
      if (origin !== this && this.connected) {
        // SignalR expects a byte array. We can pass a Uint8Array directly.
        this.hubConnection.invoke('SendUpdate', this.documentId, Array.from(update))
          .catch(err => console.error('Failed to send Yjs update:', err));
      }
    };
    this.ydoc.on('update', this._onDocUpdate);

    // 2. Listen for remote updates from the hub
    this.hubConnection.on('ReceiveUpdate', (update) => {
      const uint8Update = this._convertToUint8Array(update);
      if (uint8Update.length > 0) {
        // Apply remote update to local Y.doc. Origin is 'this' to avoid loops.
        Y.applyUpdate(this.ydoc, uint8Update, this);
      }
    });

    // 3. Listen for document state loading upon connection
    this.hubConnection.on('LoadDocumentState', (state) => {
      const uint8State = this._convertToUint8Array(state);
      if (uint8State.length > 0) {
        Y.applyUpdate(this.ydoc, uint8State, this);
      }
      this.connected = true;
      this.emit('status', [{ status: 'connected' }]);
      this.emit('synced', [true]);
    });

    // 4. Awareness / Presence Syncing
    if (this.awareness) {
      // Local awareness update -> broadcast to hub
      this._onAwarenessUpdate = ({ added, updated, removed }) => {
        if (this.connected) {
          const changedClients = added.concat(updated).concat(removed);
          // Get the current user's state
          const localState = this.awareness.getLocalState();
          
          // Serialize the local state of this client
          // We can serialize using JSON or using y-protocols/awareness serialization
          // For simplicity, let's send JSON state of the local client
          this.hubConnection.invoke('SendAwareness', this.documentId, JSON.stringify({
            clientId: this.ydoc.clientID,
            state: localState
          })).catch(err => console.error('Failed to send awareness state:', err));
        }
      };
      this.awareness.on('update', this._onAwarenessUpdate);

      // Listen for remote awareness state
      this.hubConnection.on('ReceiveAwareness', (awarenessJson) => {
        try {
          const { clientId, state } = JSON.parse(awarenessJson);
          if (clientId !== this.ydoc.clientID) {
            if (state === null) {
              this.awareness.states.delete(clientId);
            } else {
              this.awareness.states.set(clientId, state);
            }
            this.awareness.emit('change', [{ added: [], updated: [clientId], removed: [] }]);
          }
        } catch (e) {
          console.error('Error parsing remote awareness:', e);
        }
      });
    }

    // Join the document room
    this.connect();
  }

  async connect() {
    try {
      await this.hubConnection.invoke('JoinDocument', this.documentId);
      this.emit('status', [{ status: 'connecting' }]);
    } catch (err) {
      console.error('Failed to join document:', err);
      this.emit('status', [{ status: 'disconnected' }]);
    }
  }

  async disconnect() {
    this.connected = false;
    this.ydoc.off('update', this._onDocUpdate);
    if (this.awareness) {
      this.awareness.off('update', this._onAwarenessUpdate);
    }
    try {
      await this.hubConnection.invoke('LeaveDocument', this.documentId);
    } catch (err) {
      console.error('Failed to leave document:', err);
    }
    this.emit('status', [{ status: 'disconnected' }]);
  }

  destroy() {
    this.disconnect();
  }
}
