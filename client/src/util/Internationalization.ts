/** @format */

import i18n from "i18next";

i18n.init({
	resources: {
		en: {
			translation: {
				siteTitle: "Tango",
				modules: {
					auth: {
						errors: {
							credentials_failed:
								"Credentials failed! Try refreshing the page."
						}
					},
					favorites: {
						errors: {
							list: "Couldn't obtain favorites from server.",
							set: "Failed to set favorite."
						}
					},
					tags: {
						errors: {
							list: "Failed to obtain tags.",
							info: "Failed to obtain tag info."
						}
					},
					user_config: {
						errors: {
							get: "Failed to get user config.",
							set: "Failed to set user config."
						}
					}
				}
			}
		}
	},
	lng: "en",
	fallbackLng: "en",

	interpolation: {
		escapeValue: false
	}
});

export default i18n;
