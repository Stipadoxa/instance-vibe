// src/core/session-service.ts
// Session management service for AIDesigner plugin

interface SessionData {
    fileId: string;
    fileName: string;
    designState: {
        original: any;
        current: any;
        history: string[];
        frameId: string | null;
        frameName: string;
        isIterating: boolean;
    };
    scanResults: any[];
    lastModified: number;
    currentTab: string;
    currentPlatform: string;
}

export class SessionService {
    private static readonly STORAGE_PREFIX = 'aidesigner_session_';
    private static readonly ALL_SESSIONS_KEY = 'aidesigner_all_sessions';

    /**
     * Get current file information
     */
    private static getCurrentFileInfo(): { fileId: string; fileName: string } {
        const fileKey = figma.fileKey || 'unknown';
        const fileName = figma.root.name || 'Untitled';
        return { fileId: fileKey, fileName };
    }

    /**
     * Save session data for current file
     */
    static async saveSession(sessionData: Partial<SessionData>): Promise<void> {
        try {
            const { fileId, fileName } = this.getCurrentFileInfo();
            
            // Get existing session or create new one
            const existingSession = await this.getSession(fileId);
            
            const updatedSession: SessionData = {
                fileId,
                fileName,
                designState: {
                    original: sessionData.designState?.original || existingSession?.designState?.original || null,
                    current: sessionData.designState?.current || existingSession?.designState?.current || null,
                    history: sessionData.designState?.history || existingSession?.designState?.history || [],
                    frameId: sessionData.designState?.frameId || existingSession?.designState?.frameId || null,
                    frameName: sessionData.designState?.frameName || existingSession?.designState?.frameName || 'Unknown Frame',
                    isIterating: sessionData.designState?.isIterating || existingSession?.designState?.isIterating || false
                },
                scanResults: sessionData.scanResults || existingSession?.scanResults || [],
                lastModified: Date.now(),
                currentTab: sessionData.currentTab || existingSession?.currentTab || 'design-system',
                currentPlatform: sessionData.currentPlatform || existingSession?.currentPlatform || 'mobile'
            };

            // Save to plugin storage
            const storageKey = this.STORAGE_PREFIX + fileId;
            await figma.clientStorage.setAsync(storageKey, updatedSession);

            // Update all sessions index
            await this.updateAllSessionsIndex(fileId, updatedSession);

            console.log('✅ Session saved for file:', fileName);
        } catch (error) {
            console.error('❌ Failed to save session:', error);
            throw error;
        }
    }

    /**
     * Get session data for specific file
     */
    static async getSession(fileId?: string): Promise<SessionData | null> {
        try {
            const targetFileId = fileId || this.getCurrentFileInfo().fileId;
            const storageKey = this.STORAGE_PREFIX + targetFileId;
            
            const sessionData = await figma.clientStorage.getAsync(storageKey);
            return sessionData || null;
        } catch (error) {
            console.error('❌ Failed to get session:', error);
            return null;
        }
    }

    /**
     * Get current file session data
     */
    static async getCurrentSession(): Promise<SessionData | null> {
        const { fileId } = this.getCurrentFileInfo();
        return await this.getSession(fileId);
    }

    /**
     * Check if current file has a session
     */
    static async hasCurrentSession(): Promise<boolean> {
        const session = await this.getCurrentSession();
        return session !== null && (
            session.scanResults.length > 0 || 
            session.designState.history.length > 0 ||
            session.designState.current !== null
        );
    }

    /**
     * Clear session for current file
     */
    static async clearCurrentSession(): Promise<void> {
        try {
            const { fileId } = this.getCurrentFileInfo();
            const storageKey = this.STORAGE_PREFIX + fileId;
            
            await figma.clientStorage.deleteAsync(storageKey);
            await this.removeFromAllSessionsIndex(fileId);
            
            console.log('✅ Session cleared for current file');
        } catch (error) {
            console.error('❌ Failed to clear session:', error);
            throw error;
        }
    }

    /**
     * Get all sessions across all files
     */
    static async getAllSessions(): Promise<SessionData[]> {
        try {
            const allSessionsIndex = await figma.clientStorage.getAsync(this.ALL_SESSIONS_KEY) || {};
            const sessions: SessionData[] = [];

            for (const fileId of Object.keys(allSessionsIndex)) {
                const session = await this.getSession(fileId);
                if (session) {
                    sessions.push(session);
                }
            }

            // Sort by last modified (newest first)
            return sessions.sort((a, b) => b.lastModified - a.lastModified);
        } catch (error) {
            console.error('❌ Failed to get all sessions:', error);
            return [];
        }
    }

    /**
     * Delete specific session
     */
    static async deleteSession(fileId: string): Promise<void> {
        try {
            const storageKey = this.STORAGE_PREFIX + fileId;
            await figma.clientStorage.deleteAsync(storageKey);
            await this.removeFromAllSessionsIndex(fileId);
            
            console.log('✅ Session deleted for file:', fileId);
        } catch (error) {
            console.error('❌ Failed to delete session:', error);
            throw error;
        }
    }

    /**
     * Clear all sessions (used by "Clear All Data" function)
     */
    static async clearAllSessions(): Promise<void> {
        try {
            const allSessions = await this.getAllSessions();
            
            for (const session of allSessions) {
                const storageKey = this.STORAGE_PREFIX + session.fileId;
                await figma.clientStorage.deleteAsync(storageKey);
            }
            
            await figma.clientStorage.deleteAsync(this.ALL_SESSIONS_KEY);
            
            console.log('✅ All sessions cleared');
        } catch (error) {
            console.error('❌ Failed to clear all sessions:', error);
            throw error;
        }
    }

    /**
     * Update the index of all sessions
     */
    private static async updateAllSessionsIndex(fileId: string, sessionData: SessionData): Promise<void> {
        try {
            const allSessionsIndex = await figma.clientStorage.getAsync(this.ALL_SESSIONS_KEY) || {};
            
            allSessionsIndex[fileId] = {
                fileName: sessionData.fileName,
                lastModified: sessionData.lastModified
            };
            
            await figma.clientStorage.setAsync(this.ALL_SESSIONS_KEY, allSessionsIndex);
        } catch (error) {
            console.error('❌ Failed to update sessions index:', error);
        }
    }

    /**
     * Remove file from all sessions index
     */
    private static async removeFromAllSessionsIndex(fileId: string): Promise<void> {
        try {
            const allSessionsIndex = await figma.clientStorage.getAsync(this.ALL_SESSIONS_KEY) || {};
            delete allSessionsIndex[fileId];
            await figma.clientStorage.setAsync(this.ALL_SESSIONS_KEY, allSessionsIndex);
        } catch (error) {
            console.error('❌ Failed to remove from sessions index:', error);
        }
    }

    /**
     * Format session data for UI display
     */
    static formatSessionForUI(session: SessionData): any {
        return {
            fileId: session.fileId,
            fileName: session.fileName,
            designState: session.designState,
            lastModified: session.lastModified,
            frameName: session.designState.frameName,
            historyCount: session.designState.history.length,
            componentCount: session.scanResults.length
        };
    }
}