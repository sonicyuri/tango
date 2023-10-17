/** @format */

import {
	Button,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageContainer from "../../components/PageContainer";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { selectImportState } from "../../features/import/ImportSlice";
import Grid from "@mui/material/Unstable_Grid2";
import { postSetTags } from "../../features/posts/PostSlice";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import { selectUserConfigState, userConfigSet } from "../../features/user_config/UserConfigSlice";
import { ImportOptions, UserConfig } from "../../features/user_config/UserConfigService";

const ImportPage = () => {
	const { prepareResponse, lastImportedPost } = useAppSelector(selectImportState);
	const { config } = useAppSelector(selectUserConfigState);
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	let importOptions =
		prepareResponse != null && config.import_service_config
			? config.import_service_config[prepareResponse.service]
			: {
					mappings: {},
					deleted_tags: []
			  };

	const [tagMapping, setTagMapping] = useState<{ [tag: string]: string }>({ ...importOptions.mappings });
	const [deletedTags, setDeletedTags] = useState<string[]>([...importOptions.deleted_tags]);

	useEffect(() => {
		if (prepareResponse == null) {
			return;
		}

		prepareResponse.tags.forEach(t => {
			tagMapping[t] = t;
		});
		setTagMapping(Object.assign({}, tagMapping));
	}, [prepareResponse]);

	const handleSubmit = () => {
		if (lastImportedPost == null || prepareResponse == null) {
			return;
		}

		let newImportOptions: ImportOptions = { ...importOptions };
		newImportOptions.deleted_tags = deletedTags;
		newImportOptions.mappings = tagMapping;

		let configCopy: UserConfig = { ...config };
		let serviceConfigs = { ...configCopy.import_service_config } || {};
		serviceConfigs[prepareResponse.service] = newImportOptions;
		configCopy.import_service_config = serviceConfigs;

		dispatch(userConfigSet(configCopy));

		const finalTags = prepareResponse.tags
			.filter(t => deletedTags.indexOf(t) == -1)
			.map(t => tagMapping[t])
			.filter(t => t.trim().length > 0);

		dispatch(
			postSetTags({
				post: lastImportedPost,
				tags: finalTags
			})
		);
	};
	const handleCancel = () => {
		navigate(-1);
	};

	let body = <p>No import data!</p>;

	if (prepareResponse != null && lastImportedPost != null) {
		body = (
			<>
				<TableContainer sx={{ maxHeight: "90vh" }}>
					<Table stickyHeader aria-label="aliases table">
						<TableHead>
							<TableRow>
								<TableCell align="left" style={{ minWidth: 200 }}>
									Imported Tag
								</TableCell>
								<TableCell align="left" style={{ minWidth: 200 }}>
									Mapped Tag
								</TableCell>
								<TableCell align="right" style={{ minWidth: 40 }}></TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{prepareResponse.tags
								.slice()
								.sort()
								.map(oldTag => {
									const deleted = deletedTags.indexOf(oldTag) != -1;
									const classes = ["ImportPage-row"];
									if (deleted) {
										classes.push("ImportPage-row--disabled");
									}

									const newTag = tagMapping[oldTag] ?? oldTag;
									return (
										<TableRow
											hover
											role="checkbox"
											tabIndex={-1}
											key={oldTag}
											className={classes.join(" ")}>
											<TableCell align="left">{oldTag}</TableCell>
											<TableCell align="left">
												<TextField
													variant="standard"
													value={newTag}
													disabled={deleted}
													onChange={e => {
														tagMapping[oldTag] = e.target.value;
														setTagMapping({ ...tagMapping });
													}}
												/>
											</TableCell>
											<TableCell align="right">
												<IconButton
													onClick={() => {
														if (deleted) {
															deletedTags.splice(deletedTags.indexOf(oldTag), 1);
														} else {
															deletedTags.push(oldTag);
														}

														setDeletedTags([...deletedTags]);
													}}>
													{deleted ? <RestoreFromTrashIcon /> : <DeleteIcon />}
												</IconButton>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
				</TableContainer>
				<Grid container style={{ paddingTop: "15px" }}>
					<Grid xs={2}>
						<Button variant="outlined" style={{ width: "100%" }} onClick={handleCancel}>
							Cancel
						</Button>
					</Grid>
					<Grid xs={8}></Grid>
					<Grid xs={2}>
						<Button variant="contained" style={{ width: "100%" }} onClick={handleSubmit}>
							Submit
						</Button>
					</Grid>
				</Grid>
			</>
		);
	}

	return <PageContainer title="Import">{body}</PageContainer>;
};

export default ImportPage;
