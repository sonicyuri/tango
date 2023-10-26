/** @format */

interface TangoEndpointsConfig {
	v1: string;
	v2: string;
}

interface TangoStorageConfig {
	type: string;
	base_url: string;
}

interface TangoConfig {
	endpoints: TangoEndpointsConfig;
	storage: TangoStorageConfig;
}

declare global {
	interface Window {
		TangoConfig: TangoConfig;
	}
}

const getTangoConfig = (): TangoConfig => {
	return window.TangoConfig;
};

export default getTangoConfig;
