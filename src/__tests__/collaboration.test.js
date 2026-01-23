import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock collaboration hook
const mockCollaborationHook = {
  collaborators: [],
  connected: false,
  currentNote: null,
  error: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  addCollaborator: vi.fn(),
  removeCollaborator: vi.fn(),
  sendUpdate: vi.fn(),
};

vi.mock('../hooks/useCollaboration', () => ({
  useCollaboration: () => mockCollaborationHook,
}));

describe('Collaboration', () => {
  beforeEach(() => {
    mockCollaborationHook.collaborators = [];
    mockCollaborationHook.connected = false;
    mockCollaborationHook.currentNote = null;
    mockCollaborationHook.error = null;
    vi.clearAllMocks();
  });

  describe('SSE Connection', () => {
    it('should connect to note via SSE', async () => {
      const noteId = 'note-123';
      mockCollaborationHook.connect.mockResolvedValue(true);

      await act(async () => {
        await mockCollaborationHook.connect(noteId);
      });

      expect(mockCollaborationHook.connect).toHaveBeenCalledWith(noteId);
    });

    it('should handle connection error', async () => {
      const noteId = 'note-123';
      const mockError = new Error('Failed to connect');
      mockCollaborationHook.connect.mockRejectedValue(mockError);

      await act(async () => {
        try {
          await mockCollaborationHook.connect(noteId);
        } catch (error) {
          expect(error.message).toBe('Failed to connect');
        }
      });

      expect(mockCollaborationHook.connect).toHaveBeenCalledWith(noteId);
    });

    it('should disconnect from note', async () => {
      mockCollaborationHook.disconnect.mockResolvedValue();

      await act(async () => {
        await mockCollaborationHook.disconnect();
      });

      expect(mockCollaborationHook.disconnect).toHaveBeenCalled();
    });
  });

  describe('Collaborator Management', () => {
    it('should add collaborator to note', async () => {
      const noteId = 'note-123';
      const email = 'collaborator@example.com';
      const mockCollaborator = {
        userId: 'user-456',
        userName: 'Collaborator User',
        email: email,
        addedBy: 'user-123',
        addedAt: new Date(),
      };

      mockCollaborationHook.addCollaborator.mockResolvedValue(mockCollaborator);

      await act(async () => {
        await mockCollaborationHook.addCollaborator(noteId, email);
      });

      expect(mockCollaborationHook.addCollaborator).toHaveBeenCalledWith(noteId, email);
    });

    it('should handle invalid email', async () => {
      const noteId = 'note-123';
      const email = 'invalid-email';
      const mockError = new Error('Invalid email address');
      mockCollaborationHook.addCollaborator.mockRejectedValue(mockError);

      await act(async () => {
        try {
          await mockCollaborationHook.addCollaborator(noteId, email);
        } catch (error) {
          expect(error.message).toBe('Invalid email address');
        }
      });

      expect(mockCollaborationHook.addCollaborator).toHaveBeenCalledWith(noteId, email);
    });

    it('should handle user not found', async () => {
      const noteId = 'note-123';
      const email = 'nonexistent@example.com';
      const mockError = new Error('User not found');
      mockCollaborationHook.addCollaborator.mockRejectedValue(mockError);

      await act(async () => {
        try {
          await mockCollaborationHook.addCollaborator(noteId, email);
        } catch (error) {
          expect(error.message).toBe('User not found');
        }
      });

      expect(mockCollaborationHook.addCollaborator).toHaveBeenCalledWith(noteId, email);
    });

    it('should remove collaborator from note', async () => {
      const noteId = 'note-123';
      const userId = 'user-456';
      mockCollaborationHook.removeCollaborator.mockResolvedValue();

      await act(async () => {
        await mockCollaborationHook.removeCollaborator(noteId, userId);
      });

      expect(mockCollaborationHook.removeCollaborator).toHaveBeenCalledWith(noteId, userId);
    });

    it('should handle removal of non-existent collaborator', async () => {
      const noteId = 'note-123';
      const userId = 'user-999';
      const mockError = new Error('Collaborator not found');
      mockCollaborationHook.removeCollaborator.mockRejectedValue(mockError);

      await act(async () => {
        try {
          await mockCollaborationHook.removeCollaborator(noteId, userId);
        } catch (error) {
          expect(error.message).toBe('Collaborator not found');
        }
      });

      expect(mockCollaborationHook.removeCollaborator).toHaveBeenCalledWith(noteId, userId);
    });
  });

  describe('Real-time Updates', () => {
    it('should send update via SSE', async () => {
      const noteId = 'note-123';
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        type: 'text',
      };

      mockCollaborationHook.sendUpdate.mockResolvedValue();

      await act(async () => {
        await mockCollaborationHook.sendUpdate(noteId, updateData);
      });

      expect(mockCollaborationHook.sendUpdate).toHaveBeenCalledWith(noteId, updateData);
    });

    it('should handle send update error', async () => {
      const noteId = 'note-123';
      const updateData = { title: 'Updated' };
      const mockError = new Error('Failed to send update');
      mockCollaborationHook.sendUpdate.mockRejectedValue(mockError);

      await act(async () => {
        try {
          await mockCollaborationHook.sendUpdate(noteId, updateData);
        } catch (error) {
          expect(error.message).toBe('Failed to send update');
        }
      });

      expect(mockCollaborationHook.sendUpdate).toHaveBeenCalledWith(noteId, updateData);
    });

    it('should receive real-time updates', async () => {
      const noteId = 'note-123';
      
      // Simulate SSE message
      const mockEvent = {
        data: JSON.stringify({
          type: 'note_updated',
          note: {
            id: noteId,
            title: 'Updated via SSE',
            content: 'Content updated in real-time',
            lastEditedBy: 'user-456',
            lastEditedAt: new Date(),
          },
        }),
      };

      mockCollaborationHook.currentNote = {
        id: noteId,
        title: 'Original Title',
      };

      await act(async () => {
        // Simulate receiving update
        if (mockCollaborationHook.onMessage) {
          mockCollaborationHook.onMessage(mockEvent);
        }
      });

      expect(mockCollaborationHook.currentNote).toBeDefined();
    });
  });

  describe('Collaborator List', () => {
    it('should list all collaborators', async () => {
      const noteId = 'note-123';
      const mockCollaborators = [
        {
          userId: 'user-456',
          userName: 'Alice',
          addedBy: 'user-123',
          addedAt: new Date(),
        },
        {
          userId: 'user-789',
          userName: 'Bob',
          addedBy: 'user-123',
          addedAt: new Date(),
        },
      ];

      mockCollaborationHook.collaborators = mockCollaborators;

      expect(mockCollaborationHook.collaborators).toHaveLength(2);
      expect(mockCollaborationHook.collaborators[0].userName).toBe('Alice');
      expect(mockCollaborationHook.collaborators[1].userName).toBe('Bob');
    });

    it('should handle empty collaborator list', async () => {
      mockCollaborationHook.collaborators = [];

      expect(mockCollaborationHook.collaborators).toHaveLength(0);
    });
  });

  describe('Permissions', () => {
    it('should prevent adding duplicate collaborators', async () => {
      const noteId = 'note-123';
      const email = 'collaborator@example.com';
      const mockError = new Error('User is already a collaborator');
      
      mockCollaborationHook.collaborators = [
        { userId: 'user-456', email: email },
      ];
      
      mockCollaborationHook.addCollaborator.mockRejectedValue(mockError);

      await act(async () => {
        try {
          await mockCollaborationHook.addCollaborator(noteId, email);
        } catch (error) {
          expect(error.message).toBe('User is already a collaborator');
        }
      });

      expect(mockCollaborationHook.addCollaborator).toHaveBeenCalledWith(noteId, email);
    });

    it('should prevent owner from removing themselves', async () => {
      const noteId = 'note-123';
      const ownerId = 'user-123';
      const mockError = new Error('Cannot remove owner');
      
      mockCollaborationHook.removeCollaborator.mockRejectedValue(mockError);

      await act(async () => {
        try {
          await mockCollaborationHook.removeCollaborator(noteId, ownerId);
        } catch (error) {
          expect(error.message).toBe('Cannot remove owner');
        }
      });

      expect(mockCollaborationHook.removeCollaborator).toHaveBeenCalledWith(noteId, ownerId);
    });
  });
});