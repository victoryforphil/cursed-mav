import { useConnectionStore } from '#/state/connection';
import { notifications } from '@mantine/notifications';
import { parseWebMessage } from './message';
import useDroneStore from '#/state/drone';
import { useLogStore } from '#/state/logstore';
import useParamStore from '#/state/params';
import { listen } from '@tauri-apps/api/event';

const GCS_URL = 'ws://localhost:3030';

export function GCS_Connection() {
    return WebSocketSingleton.getInstance();
}

export class WebSocketSingleton {
	private static instance: WebSocketSingleton;
	private unlisten: Promise<() => void> | null = null;

	private constructor() {
		this.setupListener();
	}

	public static getInstance(): WebSocketSingleton {
		if (!WebSocketSingleton.instance) {
			WebSocketSingleton.instance = new WebSocketSingleton();
		}
		return WebSocketSingleton.instance;
	}

	public sendMessage(message: string) {
		// TODO: Implement Tauri command to send message
		console.warn('Message sending not yet implemented');
	}

	public updateParam(name: string, value: string | number | boolean | undefined) {
		// TODO: Implement Tauri command to update param
		console.warn('Parameter update not yet implemented');
	}

	private async setupListener() {
		useConnectionStore.getState().setConnecting(true);

		try {
			this.unlisten = listen("mavlink_message", (event) => {
				this.onMessage(event);
				useConnectionStore.getState().setConnected(true);
				useConnectionStore.getState().setConnecting(false);
			});

			notifications.show({
				title: 'GCS',
				message: 'Connected to Tauri backend!',
				color: 'green',
			});

		} catch (error) {
			console.error('Listener setup error:', error);
			notifications.show({
				title: 'GCS',
				message: 'Failed to connect to Tauri backend!',
				color: 'red',
			});

			useDroneStore.getState().reset();
			useLogStore.getState().reset();
			useParamStore.getState().reset();
			useConnectionStore.getState().setConnected(false);
			useConnectionStore.getState().setConnecting(false);
		}
	}

	private onMessage(event: any) {
		
		parseWebMessage(event.payload);
	}

	/**
	 * Restarts the connection via the button if possible.
	 */
	public async restart() {
		if (this.unlisten) {
			const off = await this.unlisten;
			off();
		}
		this.setupListener();
	}
}
