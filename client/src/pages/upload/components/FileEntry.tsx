/** @format */

import CloseIcon from "@mui/icons-material/Close";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import ImageIcon from "@mui/icons-material/Image";
import { IconButton, Typography } from "@mui/material";
import { DraggableProvided } from "react-beautiful-dnd";
import { FileObject } from "../UploadPage";

interface FileEntryProps {
	file: FileObject;
	remove: () => void;
	provided: DraggableProvided;
	index: number;
}

function endsWithOneOf(str: string, exts: string[]): boolean {
	return exts.some(v => str.endsWith(v));
}

const FileEntry = (props: FileEntryProps) => {
	let previewUrl: string | null = null;

	if (
		props.file.type == "url" &&
		endsWithOneOf(props.file.value, [
			".jpg",
			".jpeg",
			".png",
			".webp",
			".gif"
		])
	) {
		previewUrl = props.file.value;
	} else if (
		props.file.type == "file" &&
		props.file.value.type.startsWith("image/")
	) {
		previewUrl = URL.createObjectURL(props.file.value);
	}

	const text =
		props.file.type == "url" ? props.file.value : props.file.value.name;

	let content = <></>;

	return (
		<div
			className="FileEntry"
			ref={props.provided.innerRef}
			{...props.provided.draggableProps}
			{...props.provided.dragHandleProps}>
			<Typography className="FileEntry-index">
				{props.index + 1}
			</Typography>
			<div className="FileEntry-preview">
				{previewUrl == null ? (
					<ImageIcon fontSize="medium" />
				) : (
					<img alt="File preview" src={previewUrl} />
				)}
			</div>
			<Typography className="FileEntry-text">{text}</Typography>
			<IconButton
				className="FileEntry-close"
				onClick={() => props.remove()}>
				<CloseIcon />
			</IconButton>
			<DragHandleIcon className="FileEntry-handle" />
		</div>
	);
};

export default FileEntry;
