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
