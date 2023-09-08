/** @format */

import { UserClass } from "../UserClass";

const base: UserClass = new UserClass("base", null, {
	"change_setting": false,
	"override_config": false,
	"big_search": false,
	"manage_extension_list": false,
	"manage_alias_list": false,
	"mass_tag_edit": false,
	"view_ip": false,
	"ban_ip": false,
	"edit_user_name": false,
	"edit_user_password": false,
	"edit_user_info": false,
	"edit_user_class": false,
	"delete_user": false,
	"create_comment": false,
	"delete_comment": false,
	"bypass_comment_checks": false,
	"replace_image": false,
	"create_image": false,
	"edit_image_tag": false,
	"edit_image_source": false,
	"edit_image_owner": false,
	"edit_image_lock": false,
	"bulk_edit_image_tag": false,
	"bulk_edit_image_source": false,
	"delete_image": false,
	"ban_image": false,
	"view_eventlog": false,
	"ignore_downtime": false,
	"create_image_report": false,
	"view_image_report": false,
	"edit_wiki_page": false,
	"delete_wiki_page": false,
	"manage_blocks": false,
	"manage_admintools": false,
	"view_other_pms": false,
	"edit_feature": false,
	"bulk_edit_vote": false,
	"edit_other_vote": false,
	"view_sysinfo": false,
	"hellbanned": false,
	"view_hellbanned": false,
	"protected": false
});

const anonymous = new UserClass("anonymous", "base", {});

const user = new UserClass("user", "base", [
	"big_search",
	"create_image",
	"create_comment",
	"edit_image_tag",
	"edit_image_source",
	"create_image_report"
]);

const admin = new UserClass("admin", "base", [
	"change_setting",
	"override_config",
	"big_search",
	"edit_image_lock",
	"view_ip",
	"ban_ip",
	"edit_user_name",
	"edit_user_password",
	"edit_user_info",
	"edit_user_class",
	"delete_user",
	"create_image",
	"delete_image",
	"ban_image",
	"create_comment",
	"delete_comment",
	"bypass_comment_checks",
	"replace_image",
	"manage_extension_list",
	"manage_alias_list",
	"edit_image_tag",
	"edit_image_source",
	"edit_image_owner",
	"bulk_edit_image_tag",
	"bulk_edit_image_source",
	"mass_tag_edit",
	"create_image_report",
	"view_image_report",
	"edit_wiki_page",
	"delete_wiki_page",
	"view_eventlog",
	"manage_blocks",
	"manage_admintools",
	"ignore_downtime",
	"view_other_pms",
	"edit_feature",
	"bulk_edit_vote",
	"edit_other_vote",
	"view_sysinfo",
	"view_hellbanned",
	"protected"
]);

const hellbanned = new UserClass("hellbanned", "user", ["hellbanned"]);

export default {
	base,
	anonymous,
	user,
	admin,
	hellbanned
};
