/** @format */
import { Navigate } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { useAppDispatch, useAppSelector } from "../../features/Hooks";
import { selectAuthState } from "../../features/auth/AuthSlice";
import { UserClass } from "../../models/user_classes/UserClass";

import { ListAlt } from "@mui/icons-material";
import { notify } from "reapop";
import OptionsList, { OptionsListItem } from "../../components/OptionsList";
import { LogFactory } from "../../util/Logger";

const logger = LogFactory.create("AdminPage");

const AdminPage = () => {
	const { user: userValue } = useAppSelector(selectAuthState);
	const dispatch = useAppDispatch();
	const user = userValue.value;

	if (!user || !UserClass.canClass(user.class, "manage_admintools")) {
		dispatch(notify("Missing permissions!", "error"));
		return <Navigate to="/" />;
	}

	const menuItems: OptionsListItem[] = [];

	if (UserClass.canClass(user.class, "manage_alias_list")) {
		menuItems.push({
			text: "Edit Aliases",
			url: "/tags/aliases",
			icon: <ListAlt />
		});
	}

	return (
		<PageContainer title="Admin">
			<OptionsList menuItems={menuItems} />
		</PageContainer>
	);
};

export default AdminPage;
