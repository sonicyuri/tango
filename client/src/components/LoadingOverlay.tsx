/** @format */

import LoadingSpinner from "./LoadingSpinner";

export interface LoadingOverlayProps {
	isLoading: boolean;
}

const LoadingOverlay = (props: LoadingOverlayProps) => {
	return (
		<div className="LoadingOverlay" style={{ visibility: props.isLoading ? "visible" : "hidden" }}>
			<LoadingSpinner />
		</div>
	);
};

export default LoadingOverlay;
