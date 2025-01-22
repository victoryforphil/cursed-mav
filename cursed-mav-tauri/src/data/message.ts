import useDroneStore from '#/state/drone';
import { useLogStore } from '#/state/logstore';
import { decode } from '@msgpack/msgpack';
import { useConnectionStore } from '#/state/connection';
import useParamStore from '#/state/params';


interface WebMessage {
	topic: string;
	datapoint: any;
}

type TopicStore = Map<string, any>;

const topicStore: TopicStore = new Map();
let paramStore: TopicStore = new Map();

function getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function removeParamPrefix(input: string): string {
    return input.startsWith("params/") ? input.slice(7) : input;
}

function parseDataFields(web_message: WebMessage, topic_store: TopicStore, param_store: TopicStore) {
	const timeStamp = getCurrentTime()
	const { topic, datapoint } = web_message;

	if (topic.toLowerCase().includes("param_value")) {
		const paramId = datapoint.param_id;
		const paramName = String.fromCharCode(...paramId).replace(/\0/g, '');
		param_store.set(paramName, datapoint)
		//console.log(`Updating Param: ${paramName}`)
	} else {
		topic_store.set(topic, datapoint)
		//console.log(`Updating Topic: ${topic}`)
	}
	
}

/**
 * Parses the lil-gcs message data
 * @param data event.data coming from websocket
 */
export function parseWebMessage(data: any) {
	const topic = data.message.type;
	const message: WebMessage = {
		topic: topic,
		datapoint: data.message
	};
	parseDataFields(message, topicStore, paramStore);

	useDroneStore.getState().overrideMap(topicStore);
	useConnectionStore.getState().setRecieved(Date.now());

	if (paramStore.size > 0) {
		useParamStore.getState().overrideMap(paramStore);
		paramStore = new Map();
	}
}
