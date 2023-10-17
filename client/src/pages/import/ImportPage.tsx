/** @format */

import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import PageContainer from "../../components/PageContainer";
import { useAppSelector } from "../../features/Hooks";
import { selectImportState } from "../../features/import/ImportSlice";
import Grid from "@mui/material/Unstable_Grid2";

const ImportPage = () => {
	const { loadingState, prepareResponse } = useAppSelector(selectImportState);
	const [tagMapping, setTagMapping] = useState<{ [tag: string]: string }>({});

	useEffect(() => {
		if (prepareResponse == null) {
			return;
		}

		prepareResponse.tags.forEach(t => {
			tagMapping[t] = t;
		});
		setTagMapping(Object.assign({}, tagMapping));
	}, [prepareResponse]);

	let body = <p>No import data!</p>;

	if (prepareResponse != null) {
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
							</TableRow>
						</TableHead>
						<TableBody>
							{prepareResponse.tags
								.slice()
								.sort()
								.map(oldTag => {
									const newTag = tagMapping[oldTag] ?? oldTag;
									return (
										<TableRow hover role="checkbox" tabIndex={-1} key={oldTag}>
											<TableCell align="left">{oldTag}</TableCell>
											<TableCell align="left">
												<TextField
													variant="standard"
													value={newTag}
													onChange={e => {
														tagMapping[oldTag] = e.target.value;
														setTagMapping({ ...tagMapping });
													}}
												/>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
				</TableContainer>
				<Grid container style={{ paddingTop: "15px" }}>
					<Grid xs={10}></Grid>
					<Grid xs={2}>
						<Button variant="contained" style={{ width: "100%" }}>
							Submit Tags
						</Button>
					</Grid>
				</Grid>
			</>
		);
	}

	return <PageContainer title="Import">{body}</PageContainer>;
};

export default ImportPage;
