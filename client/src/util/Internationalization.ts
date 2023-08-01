import i18n from "i18next";

i18n
	.init({
		resources: {
			en: {
				translation: {
					siteTitle: "Tango"
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