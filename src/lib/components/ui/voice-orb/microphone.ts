export type Microphone = {
	/** Feed this to the orb's `analyser` prop to follow the reader's voice. */
	analyser: AnalyserNode;
	/** Stops the microphone and releases the audio graph. */
	close: () => void;
};

/**
 * Opens the microphone for a live voice level. Call it from a click or key
 * press, never on load: the browser asks the reader for permission, and
 * nothing is recorded. Rejects when access is blocked or unavailable.
 */
export async function openMicrophone(): Promise<Microphone> {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const stopTracks = () => {
		for (const track of stream.getTracks()) track.stop();
	};
	let context: AudioContext | undefined;
	let analyser: AnalyserNode;
	try {
		context = new AudioContext();
		analyser = context.createAnalyser();
		analyser.fftSize = 1024;
		context.createMediaStreamSource(stream).connect(analyser);
	} catch (error) {
		// Without an audio graph the microphone would stay on with nothing listening.
		stopTracks();
		void context?.close();
		throw error;
	}
	let closed = false;
	return {
		analyser,
		close() {
			if (closed) return;
			closed = true;
			stopTracks();
			void context?.close();
		}
	};
}
