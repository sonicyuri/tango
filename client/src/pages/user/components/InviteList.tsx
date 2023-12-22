import { Button, IconButton, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow } from "@mui/material";
import { useEffect } from "react";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../../../features/Hooks";
import { inviteCreate, inviteDelete, inviteList, selectInviteState } from "../../../features/invites/InviteSlice";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import moment from "moment";

const InviteList = () =>
{
	const { invites, loadingState } = useAppSelector(selectInviteState);
	const dispatch = useAppDispatch();

	const handleGenerateInvite = () =>
	{
		dispatch(inviteCreate(null));
	};

	const handleDeleteInvite = (invite_id: string) =>
	{
		dispatch(inviteDelete(invite_id));
	}

	useEffect(() =>
	{
		dispatch(inviteList(null));
	}, []);

	return (
		<TableContainer sx={{ maxHeight: "90vh" }}>
			<Table stickyHeader aria-label="invites table">
				<TableHead>
					<TableRow>
						<TableCell align="left" style={{ minWidth: 200 }}>
							Invite Code
						</TableCell>
						<TableCell align="left" style={{ minWidth: 200 }}>
							Status
						</TableCell>
						<TableCell align="left" style={{ minWidth: 200 }}>
							Action
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{loadingState == "loading" ? <LoadingSpinner /> : invites.map(invite => {
						return (
							<TableRow hover role="checkbox" tabIndex={-1} key={"invite-" + invite.id}>
								<TableCell align="left">{invite.invite_code}</TableCell>
								<TableCell align="left" style={{fontStyle: "italic"}}>
									{invite.redeemed ? "Redeemed " + moment(invite.redeemed_time).format("dddd, MMMM Do YYYY, h:mm:ss a") : "Unused"}
								</TableCell>
								<TableCell align="left">
									<IconButton aria-label="delete invite" onClick={() => handleDeleteInvite(invite.id)}>
										<DeleteForeverIcon />
									</IconButton>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
				<TableFooter>
					<TableRow>
						<TableCell />
						<TableCell />
						<TableCell>
							<Button fullWidth color="primary" variant="contained" onClick={handleGenerateInvite}>
								{loadingState == "loading" ? <LoadingSpinner /> : <span>Generate Invite</span>}
							</Button>
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</TableContainer>);
}

export default InviteList;