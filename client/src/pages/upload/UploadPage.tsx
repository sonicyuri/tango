/** @format */
import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { selectAuthState } from "../../features/auth/AuthSlice";

import AddIcon from "@mui/icons-material/Add";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import {
	Button,
	FormControlLabel,
	LinearProgress,
	Stack,
	Switch,
	TextField,
	Typography
} from "@mui/material";
import {
	DragDropContext,
	Draggable,
	DropResult,
	Droppable
} from "react-beautiful-dnd";
import { notify } from "reapop";
import TagInput from "../../components/TagInput";
import { PostUploadRequest } from "../../features/posts/PostService";
import { postUpload, selectPostState } from "../../features/posts/PostSlice";
import { LogFactory } from "../../util/Logger";
import FileEntry from "./components/FileEntry";

const logger = LogFactory.create("UploadPage");
const SupportedMimeTypes = [
	"video/mp4",
	"video/webm",
	"image/png",
	"image/webp",
	"image/jpeg",
	"image/gif",
	"application/x-shockwave-flash",
	".swf"
];

export type FileObject =
	| { type: "url"; value: string }
	| { type: "file"; value: File };

const UploadPage = () => {
	const { user } = useAppSelector(selectAuthState);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { uploadState, uploadProgress } = useAppSelector(selectPostState);

	const fileRef = useRef<HTMLInputElement | null>(null);
	const [files, setFiles] = useState<FileObject[]>([]);
	const [fileUrl, setFileUrl] = useState<string>("");
	const [createPool, setCreatePool] = useState(false);
	const [tags, setTags] = useState<string[]>([]);
	const [poolName, setPoolName] = useState("");
	const [poolDesc, setPoolDesc] = useState("");
	const [poolPrivate, setPoolPrivate] = useState(false);

	if (!user) {
		dispatch(notify("Can't upload without logging in!"));
		return <Navigate to="/" />;
	}

	const handleUploadUrl = () => {
		const url = fileUrl.trim();
		if (url.length < 3) {
			return;
		}

		setFiles([...files, { type: "url", value: url }]);
		setFileUrl("");
	};

	const handleUploadFile = () => {
		if (fileRef.current != null) {
			fileRef.current.click();
		}
	};

	const handleSubmit = () => {
		const req: PostUploadRequest = {
			files,
			tags
		};

		if (createPool) {
			req.pool = {
				title: poolName,
				description: poolDesc,
				private: poolPrivate
			};
		}

		dispatch(postUpload(req))
			.unwrap()
			.then(v => {
				navigate("/posts/view/" + v.posts[Object.keys(v.posts)[0]].id);
			});
	};

	const onFileChange = () => {
		if (fileRef.current == null) {
			return;
		}

		const selectedFiles = fileRef.current.files;
		if (selectedFiles == null || selectedFiles.length < 1) {
			return;
		}

		setFiles([...files, { type: "file", value: selectedFiles[0] }]);
	};

	const onDragEnd = (result: DropResult) => {
		if (result.destination == null) {
			return;
		}

		let item = files[result.source.index];
		files.splice(result.source.index, 1);
		files.splice(result.destination.index, 0, item);
		setFiles([...files]);
	};

	const uploadBody = (
		<>
			<div className="Upload-FilePicker">
				<TextField
					variant="outlined"
					placeholder="File URL"
					value={fileUrl}
					onChange={e => setFileUrl(e.target.value)}
				/>
				<input
					type="file"
					multiple
					ref={fileRef}
					accept={SupportedMimeTypes.join(",")}
					onChange={e => onFileChange()}
				/>
				<Button
					variant="contained"
					title="Upload file from URL"
					disabled={fileUrl.trim().length < 3}
					onClick={handleUploadUrl}>
					<AddIcon />
				</Button>
				<Button
					variant="contained"
					title="Upload file from your hard drive"
					onClick={handleUploadFile}>
					<AttachFileIcon />
				</Button>
			</div>
			<DragDropContext onDragEnd={onDragEnd}>
				<Droppable droppableId="droppable">
					{provided => (
						<div
							className="Upload-Files"
							style={{
								visibility:
									files.length > 0 ? "visible" : "hidden"
							}}
							ref={provided.innerRef}
							{...provided.droppableProps}>
							{files.map((f, i) => (
								<Draggable
									key={"file-" + i}
									draggableId={"file-" + i}
									index={i}>
									{provided => (
										<FileEntry
											provided={provided}
											index={i}
											file={f}
											remove={() => {
												files.splice(i, 1);
												setFiles([...files]);
											}}
										/>
									)}
								</Draggable>
							))}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</DragDropContext>
			<div className="Upload-Options">
				<Typography variant="h6">Upload Options</Typography>
				<FormControlLabel
					control={
						<Switch
							value={createPool}
							onChange={e =>
								setCreatePool(e.currentTarget.checked)
							}
						/>
					}
					label="Create pool from uploaded images"
				/>
				<div
					className="Upload-PoolOptions"
					style={{ display: createPool ? "block" : "none" }}>
					<Stack spacing={2} alignItems="left">
						<TextField
							label="Pool title"
							placeholder="Title"
							value={poolName}
							onChange={e => setPoolName(e.currentTarget.value)}
						/>
						<TextField
							label="Pool description"
							multiline
							placeholder="Description"
							value={poolDesc}
							onChange={e => setPoolDesc(e.currentTarget.value)}
						/>
						<FormControlLabel
							control={
								<Switch
									value={poolPrivate}
									onChange={e =>
										setPoolPrivate(e.currentTarget.checked)
									}
								/>
							}
							label="Make pool private (visible to only you)"
						/>
					</Stack>
				</div>
				<Typography>Add tags to uploaded posts</Typography>
				<TagInput
					variant="edit"
					values={tags}
					onValuesChange={t => setTags(t)}
					onSubmit={() => {}}
				/>
			</div>
			<div className="Upload-Buttons">
				<Button variant="contained" onClick={handleSubmit}>
					Submit
				</Button>
			</div>
		</>
	);

	const progressBody = (
		<div className="Upload-Progress">
			<Typography>Uploading {files.length} files</Typography>
			<LinearProgress
				variant="determinate"
				value={uploadProgress * 100.0}
			/>
		</div>
	);

	return (
		<PageContainer title="Upload">
			{uploadState == "uploading" ? progressBody : uploadBody}
		</PageContainer>
	);
};

export default UploadPage;
