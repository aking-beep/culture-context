#!/usr/bin/env python3
"""Build the world-country catalog from World Bank + GOV.UK travel-advice index.

Reference data only. Not law. Run from repo root:
  python3 scripts/build_world_countries.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "world-countries.json"
WEB_OUT = ROOT / "apps" / "web" / "src" / "lib" / "world-countries.json"
MOBILE_OUT = ROOT / "apps" / "mobile" / "src" / "world-countries.json"

WB_NAME_FIX = {
    "Bahamas, The": "Bahamas",
    "Gambia, The": "The Gambia",
    "Egypt, Arab Rep.": "Egypt",
    "Iran, Islamic Rep.": "Iran",
    "Yemen, Rep.": "Yemen",
    "Congo, Dem. Rep.": "Democratic Republic of the Congo",
    "Congo, Rep.": "Congo",
    "Korea, Rep.": "South Korea",
    "Korea, Dem. People's Rep.": "North Korea",
    "Hong Kong SAR, China": "Hong Kong",
    "Macao SAR, China": "Macao",
    "West Bank and Gaza": "Palestine",
    "Slovak Republic": "Slovakia",
    "Kyrgyz Republic": "Kyrgyzstan",
    "Lao PDR": "Laos",
    "Czechia": "Czechia",
    "Turkiye": "Turkey",
    "Cote d'Ivoire": "Côte d'Ivoire",
    "St. Lucia": "St Lucia",
    "St. Kitts and Nevis": "St Kitts and Nevis",
    "St. Vincent and the Grenadines": "St Vincent and the Grenadines",
    "St. Martin (French part)": "St Martin",
    "Sint Maarten (Dutch part)": "St Maarten",
    "Micronesia, Fed. Sts.": "Federated States of Micronesia",
    "Sao Tome and Principe": "São Tomé and Principe",
    "Virgin Islands (U.S.)": "US Virgin Islands",
    "British Virgin Islands": "British Virgin Islands",
    "Venezuela, RB": "Venezuela",
    "Tanzania": "Tanzania",
    "Eswatini": "Eswatini",
    "Cabo Verde": "Cape Verde",
    "Russian Federation": "Russia",
    "Syrian Arab Republic": "Syria",
    "Viet Nam": "Vietnam",
    "Brunei Darussalam": "Brunei",
    "Somalia": "Somalia",
    "Somalia, Fed. Rep.": "Somalia",
}

SLUG_ISO2 = {
    "usa": "US",
    "south-korea": "KR",
    "north-korea": "KP",
    "cote-d-ivoire": "CI",
    "myanmar": "MM",
    "palestine": "PS",
    "hong-kong": "HK",
    "macao": "MO",
    "taiwan": "TW",
    "kosovo": "XK",
    "the-gambia": "GM",
    "timor-leste": "TL",
    "czechia": "CZ",
    "democratic-republic-of-the-congo": "CD",
    "congo": "CG",
    "eswatini": "SZ",
    "cape-verde": "CV",
    "federated-states-of-micronesia": "FM",
    "british-virgin-islands": "VG",
    "cayman-islands": "KY",
    "turks-and-caicos-islands": "TC",
    "falkland-islands": "FK",
    "gibraltar": "GI",
    "bermuda": "BM",
    "aruba": "AW",
    "curacao": "CW",
    "anguilla": "AI",
    "montserrat": "MS",
    "pitcairn-island": "PN",
    "british-indian-ocean-territory": "IO",
    "south-georgia-and-south-sandwich-islands": "GS",
    "antarctica-british-antarctic-territory": "AQ",
    "st-helena-ascension-and-tristan-da-cunha": "SH",
    "st-pierre-and-miquelon": "PM",
    "st-maarten": "SX",
    "st-martin-and-st-barthelemy": "MF",
    "bonaire-st-eustatius-saba": "BQ",
    "cook-islands-tokelau-and-niue": "CK",
    "wallis-and-futuna": "WF",
    "french-guiana": "GF",
    "french-polynesia": "PF",
    "new-caledonia": "NC",
    "reunion": "RE",
    "mayotte": "YT",
    "guadeloupe": "GP",
    "martinique": "MQ",
    "western-sahara": "EH",
    "vatican-city": "VA",
}

SKIP_ISO2 = {"JG"}  # World Bank aggregate, not a passport country

ALIASES_EXTRA = {
    "US": ["USA", "United States of America", "America"],
    "GB": ["UK", "Great Britain", "Britain", "England", "Scotland", "Wales"],
    "NL": ["Holland"],
    "AE": ["UAE", "Dubai", "Abu Dhabi"],
    "KR": ["Korea", "Republic of Korea"],
    "CZ": ["Czech Republic"],
    "CI": ["Ivory Coast"],
    "RU": ["Russian Federation"],
    "VN": ["Viet Nam"],
    "MM": ["Burma"],
    "SZ": ["Swaziland"],
    "TL": ["East Timor"],
    "CD": ["DRC", "DR Congo"],
}

LEFT_DRIVE = {
    "AG", "AI", "AU", "BB", "BD", "BM", "BN", "BS", "BT", "BW", "CC", "CK", "CX",
    "CY", "DM", "FJ", "FK", "GB", "GD", "GG", "GY", "HK", "ID", "IE", "IM", "IN",
    "JE", "JM", "JP", "KE", "KI", "KN", "KY", "LC", "LK", "LS", "MO", "MS", "MT",
    "MU", "MV", "MW", "MY", "MZ", "NA", "NF", "NP", "NR", "NZ", "PG", "PK", "PN",
    "SB", "SC", "SG", "SH", "SR", "SZ", "TC", "TH", "TK", "TL", "TO", "TT", "TV",
    "TZ", "UG", "VC", "VG", "VU", "WS", "ZA", "ZM", "ZW",
}

EUR = ("EUR", "Euro")
CURRENCY = {
    "AD": EUR, "AE": ("AED", "UAE dirham"), "AF": ("AFN", "Afghan afghani"),
    "AG": ("XCD", "East Caribbean dollar"), "AI": ("XCD", "East Caribbean dollar"),
    "AL": ("ALL", "Albanian lek"), "AM": ("AMD", "Armenian dram"),
    "AO": ("AOA", "Angolan kwanza"), "AR": ("ARS", "Argentine peso"),
    "AS": ("USD", "United States dollar"), "AT": EUR, "AU": ("AUD", "Australian dollar"),
    "AW": ("AWG", "Aruban florin"), "AZ": ("AZN", "Azerbaijani manat"),
    "BA": ("BAM", "Bosnia and Herzegovina convertible mark"), "BB": ("BBD", "Barbadian dollar"),
    "BD": ("BDT", "Bangladeshi taka"), "BE": EUR, "BF": ("XOF", "West African CFA franc"),
    "BG": ("BGN", "Bulgarian lev"), "BH": ("BHD", "Bahraini dinar"),
    "BI": ("BIF", "Burundian franc"), "BJ": ("XOF", "West African CFA franc"),
    "BM": ("BMD", "Bermudian dollar"), "BN": ("BND", "Brunei dollar"),
    "BO": ("BOB", "Bolivian boliviano"), "BQ": ("USD", "United States dollar"),
    "BR": ("BRL", "Brazilian real"), "BS": ("BSD", "Bahamian dollar"),
    "BT": ("BTN", "Bhutanese ngultrum"), "BW": ("BWP", "Botswana pula"),
    "BY": ("BYN", "Belarusian ruble"), "BZ": ("BZD", "Belize dollar"),
    "CA": ("CAD", "Canadian dollar"), "CD": ("CDF", "Congolese franc"),
    "CF": ("XAF", "Central African CFA franc"), "CG": ("XAF", "Central African CFA franc"),
    "CH": ("CHF", "Swiss franc"), "CI": ("XOF", "West African CFA franc"),
    "CK": ("NZD", "New Zealand dollar"), "CL": ("CLP", "Chilean peso"),
    "CM": ("XAF", "Central African CFA franc"), "CN": ("CNY", "Chinese yuan"),
    "CO": ("COP", "Colombian peso"), "CR": ("CRC", "Costa Rican colón"),
    "CU": ("CUP", "Cuban peso"), "CV": ("CVE", "Cape Verdean escudo"),
    "CW": ("ANG", "Netherlands Antillean guilder"), "CY": EUR, "CZ": ("CZK", "Czech koruna"),
    "DE": EUR, "DJ": ("DJF", "Djiboutian franc"), "DK": ("DKK", "Danish krone"),
    "DM": ("XCD", "East Caribbean dollar"), "DO": ("DOP", "Dominican peso"),
    "DZ": ("DZD", "Algerian dinar"), "EC": ("USD", "United States dollar"),
    "EE": EUR, "EG": ("EGP", "Egyptian pound"), "EH": ("MAD", "Moroccan dirham"),
    "ER": ("ERN", "Eritrean nakfa"), "ES": EUR, "ET": ("ETB", "Ethiopian birr"),
    "FI": EUR, "FJ": ("FJD", "Fijian dollar"), "FK": ("FKP", "Falkland Islands pound"),
    "FM": ("USD", "United States dollar"), "FR": EUR, "GA": ("XAF", "Central African CFA franc"),
    "GB": ("GBP", "Pound sterling"), "GD": ("XCD", "East Caribbean dollar"),
    "GE": ("GEL", "Georgian lari"), "GF": EUR, "GG": ("GBP", "Pound sterling"),
    "GH": ("GHS", "Ghanaian cedi"), "GI": ("GIP", "Gibraltar pound"),
    "GL": ("DKK", "Danish krone"), "GM": ("GMD", "Gambian dalasi"),
    "GN": ("GNF", "Guinean franc"), "GP": EUR, "GQ": ("XAF", "Central African CFA franc"),
    "GR": EUR, "GT": ("GTQ", "Guatemalan quetzal"), "GU": ("USD", "United States dollar"),
    "GW": ("XOF", "West African CFA franc"), "GY": ("GYD", "Guyanese dollar"),
    "HK": ("HKD", "Hong Kong dollar"), "HN": ("HNL", "Honduran lempira"),
    "HR": EUR, "HT": ("HTG", "Haitian gourde"), "HU": ("HUF", "Hungarian forint"),
    "ID": ("IDR", "Indonesian rupiah"), "IE": EUR, "IL": ("ILS", "Israeli new shekel"),
    "IM": ("GBP", "Pound sterling"), "IN": ("INR", "Indian rupee"),
    "IQ": ("IQD", "Iraqi dinar"), "IR": ("IRR", "Iranian rial"), "IS": ("ISK", "Icelandic króna"),
    "IT": EUR, "JE": ("GBP", "Pound sterling"), "JM": ("JMD", "Jamaican dollar"),
    "JO": ("JOD", "Jordanian dinar"), "JP": ("JPY", "Japanese yen"),
    "KE": ("KES", "Kenyan shilling"), "KG": ("KGS", "Kyrgyzstani som"),
    "KH": ("KHR", "Cambodian riel"), "KI": ("AUD", "Australian dollar"),
    "KM": ("KMF", "Comorian franc"), "KN": ("XCD", "East Caribbean dollar"),
    "KP": ("KPW", "North Korean won"), "KR": ("KRW", "South Korean won"),
    "KW": ("KWD", "Kuwaiti dinar"), "KY": ("KYD", "Cayman Islands dollar"),
    "KZ": ("KZT", "Kazakhstani tenge"), "LA": ("LAK", "Lao kip"),
    "LB": ("LBP", "Lebanese pound"), "LC": ("XCD", "East Caribbean dollar"),
    "LI": ("CHF", "Swiss franc"), "LK": ("LKR", "Sri Lankan rupee"),
    "LR": ("LRD", "Liberian dollar"), "LS": ("LSL", "Lesotho loti"),
    "LT": EUR, "LU": EUR, "LV": EUR, "LY": ("LYD", "Libyan dinar"),
    "MA": ("MAD", "Moroccan dirham"), "MC": EUR, "MD": ("MDL", "Moldovan leu"),
    "ME": EUR, "MF": EUR, "MG": ("MGA", "Malagasy ariary"),
    "MH": ("USD", "United States dollar"), "MK": ("MKD", "Macedonian denar"),
    "ML": ("XOF", "West African CFA franc"), "MM": ("MMK", "Myanmar kyat"),
    "MN": ("MNT", "Mongolian tögrög"), "MO": ("MOP", "Macanese pataca"),
    "MP": ("USD", "United States dollar"), "MQ": EUR, "MR": ("MRU", "Mauritanian ouguiya"),
    "MS": ("XCD", "East Caribbean dollar"), "MT": EUR, "MU": ("MUR", "Mauritian rupee"),
    "MV": ("MVR", "Maldivian rufiyaa"), "MW": ("MWK", "Malawian kwacha"),
    "MX": ("MXN", "Mexican peso"), "MY": ("MYR", "Malaysian ringgit"),
    "MZ": ("MZN", "Mozambican metical"), "NA": ("NAD", "Namibian dollar"),
    "NC": ("XPF", "CFP franc"), "NE": ("XOF", "West African CFA franc"),
    "NG": ("NGN", "Nigerian naira"), "NI": ("NIO", "Nicaraguan córdoba"),
    "NL": EUR, "NO": ("NOK", "Norwegian krone"), "NP": ("NPR", "Nepalese rupee"),
    "NR": ("AUD", "Australian dollar"), "NU": ("NZD", "New Zealand dollar"),
    "NZ": ("NZD", "New Zealand dollar"), "OM": ("OMR", "Omani rial"),
    "PA": ("PAB", "Panamanian balboa"), "PE": ("PEN", "Peruvian sol"),
    "PF": ("XPF", "CFP franc"), "PG": ("PGK", "Papua New Guinean kina"),
    "PH": ("PHP", "Philippine peso"), "PK": ("PKR", "Pakistani rupee"),
    "PL": ("PLN", "Polish złoty"), "PM": EUR, "PN": ("NZD", "New Zealand dollar"),
    "PR": ("USD", "United States dollar"), "PS": ("ILS", "Israeli new shekel"),
    "PT": EUR, "PW": ("USD", "United States dollar"), "PY": ("PYG", "Paraguayan guaraní"),
    "QA": ("QAR", "Qatari riyal"), "RE": EUR, "RO": ("RON", "Romanian leu"),
    "RS": ("RSD", "Serbian dinar"), "RU": ("RUB", "Russian ruble"),
    "RW": ("RWF", "Rwandan franc"), "SA": ("SAR", "Saudi riyal"),
    "SB": ("SBD", "Solomon Islands dollar"), "SC": ("SCR", "Seychellois rupee"),
    "SD": ("SDG", "Sudanese pound"), "SE": ("SEK", "Swedish krona"),
    "SG": ("SGD", "Singapore dollar"), "SH": ("SHP", "Saint Helena pound"),
    "SI": EUR, "SK": EUR, "SL": ("SLE", "Sierra Leonean leone"),
    "SM": EUR, "SN": ("XOF", "West African CFA franc"), "SO": ("SOS", "Somali shilling"),
    "SR": ("SRD", "Surinamese dollar"), "SS": ("SSP", "South Sudanese pound"),
    "ST": ("STN", "São Tomé and Príncipe dobra"), "SV": ("USD", "United States dollar"),
    "SX": ("ANG", "Netherlands Antillean guilder"), "SY": ("SYP", "Syrian pound"),
    "SZ": ("SZL", "Swazi lilangeni"), "TC": ("USD", "United States dollar"),
    "TD": ("XAF", "Central African CFA franc"), "TG": ("XOF", "West African CFA franc"),
    "TH": ("THB", "Thai baht"), "TJ": ("TJS", "Tajikistani somoni"),
    "TK": ("NZD", "New Zealand dollar"), "TL": ("USD", "United States dollar"),
    "TM": ("TMT", "Turkmenistan manat"), "TN": ("TND", "Tunisian dinar"),
    "TO": ("TOP", "Tongan paʻanga"), "TR": ("TRY", "Turkish lira"),
    "TT": ("TTD", "Trinidad and Tobago dollar"), "TV": ("AUD", "Australian dollar"),
    "TW": ("TWD", "New Taiwan dollar"), "TZ": ("TZS", "Tanzanian shilling"),
    "UA": ("UAH", "Ukrainian hryvnia"), "UG": ("UGX", "Ugandan shilling"),
    "US": ("USD", "United States dollar"), "UY": ("UYU", "Uruguayan peso"),
    "UZ": ("UZS", "Uzbekistani som"), "VA": EUR, "VC": ("XCD", "East Caribbean dollar"),
    "VE": ("VES", "Venezuelan bolívar"), "VG": ("USD", "United States dollar"),
    "VI": ("USD", "United States dollar"), "VN": ("VND", "Vietnamese đồng"),
    "VU": ("VUV", "Vanuatu vatu"), "WF": ("XPF", "CFP franc"),
    "WS": ("WST", "Samoan tala"), "XK": EUR, "YE": ("YER", "Yemeni rial"),
    "YT": EUR, "ZA": ("ZAR", "South African rand"), "ZM": ("ZMW", "Zambian kwacha"),
    "ZW": ("ZWG", "Zimbabwe gold"),
}

LANGUAGES = {
    "US": ["English"], "GB": ["English"], "CA": ["English", "French"], "AU": ["English"],
    "NZ": ["English", "Māori"], "IE": ["English", "Irish"], "IN": ["Hindi", "English"],
    "PK": ["Urdu", "English"], "NG": ["English"], "GH": ["English"], "KE": ["English", "Swahili"],
    "ZA": ["English", "Zulu", "Afrikaans"], "PH": ["Filipino", "English"], "SG": ["English", "Malay", "Mandarin"],
    "MY": ["Malay"], "ID": ["Indonesian"], "TH": ["Thai"], "VN": ["Vietnamese"], "KH": ["Khmer"],
    "LA": ["Lao"], "MM": ["Burmese"], "JP": ["Japanese"], "KR": ["Korean"], "CN": ["Mandarin Chinese"],
    "TW": ["Mandarin Chinese"], "HK": ["Cantonese", "English"], "MO": ["Cantonese", "Portuguese"],
    "MX": ["Spanish"], "ES": ["Spanish"], "AR": ["Spanish"], "CO": ["Spanish"], "CL": ["Spanish"],
    "PE": ["Spanish"], "VE": ["Spanish"], "EC": ["Spanish"], "GT": ["Spanish"], "CU": ["Spanish"],
    "BR": ["Portuguese"], "PT": ["Portuguese"], "AO": ["Portuguese"], "MZ": ["Portuguese"],
    "FR": ["French"], "BE": ["Dutch", "French"], "CH": ["German", "French", "Italian"],
    "DE": ["German"], "AT": ["German"], "NL": ["Dutch"], "IT": ["Italian"], "GR": ["Greek"],
    "TR": ["Turkish"], "RU": ["Russian"], "UA": ["Ukrainian"], "PL": ["Polish"], "CZ": ["Czech"],
    "RO": ["Romanian"], "HU": ["Hungarian"], "SE": ["Swedish"], "NO": ["Norwegian"], "DK": ["Danish"],
    "FI": ["Finnish", "Swedish"], "IS": ["Icelandic"], "EG": ["Arabic"], "SA": ["Arabic"],
    "AE": ["Arabic"], "QA": ["Arabic"], "KW": ["Arabic"], "BH": ["Arabic"], "OM": ["Arabic"],
    "JO": ["Arabic"], "LB": ["Arabic"], "MA": ["Arabic", "Berber"], "TN": ["Arabic"], "DZ": ["Arabic"],
    "IL": ["Hebrew", "Arabic"], "IR": ["Persian"], "IQ": ["Arabic", "Kurdish"], "AF": ["Pashto", "Dari"],
    "BD": ["Bengali"], "LK": ["Sinhala", "Tamil"], "NP": ["Nepali"], "ET": ["Amharic"],
    "TZ": ["Swahili", "English"], "UG": ["English", "Swahili"], "RW": ["Kinyarwanda", "English", "French"],
    "SN": ["French"], "CI": ["French"], "CM": ["French", "English"], "CD": ["French"],
    "MG": ["Malagasy", "French"], "MU": ["English", "French"], "FJ": ["English", "Fijian"],
    "PG": ["English", "Tok Pisin"], "WS": ["Samoan", "English"],
}

EXTRA = [
    {"iso2": "TW", "iso3": "TWN", "name": "Taiwan", "capital": "Taipei"},
    {"iso2": "VA", "iso3": "VAT", "name": "Vatican City", "capital": "Vatican City"},
    {"iso2": "AI", "iso3": "AIA", "name": "Anguilla", "capital": "The Valley"},
    {"iso2": "AQ", "iso3": "ATA", "name": "Antarctica", "capital": ""},
    {"iso2": "BQ", "iso3": "BES", "name": "Bonaire, Sint Eustatius and Saba", "capital": ""},
    {"iso2": "CK", "iso3": "COK", "name": "Cook Islands", "capital": "Avarua"},
    {"iso2": "EH", "iso3": "ESH", "name": "Western Sahara", "capital": "Laayoune"},
    {"iso2": "FK", "iso3": "FLK", "name": "Falkland Islands", "capital": "Stanley"},
    {"iso2": "GF", "iso3": "GUF", "name": "French Guiana", "capital": "Cayenne"},
    {"iso2": "GP", "iso3": "GLP", "name": "Guadeloupe", "capital": "Basse-Terre"},
    {"iso2": "GS", "iso3": "SGS", "name": "South Georgia and the South Sandwich Islands", "capital": "King Edward Point"},
    {"iso2": "IO", "iso3": "IOT", "name": "British Indian Ocean Territory", "capital": "Diego Garcia"},
    {"iso2": "MQ", "iso3": "MTQ", "name": "Martinique", "capital": "Fort-de-France"},
    {"iso2": "MS", "iso3": "MSR", "name": "Montserrat", "capital": "Plymouth"},
    {"iso2": "PN", "iso3": "PCN", "name": "Pitcairn Islands", "capital": "Adamstown"},
    {"iso2": "PM", "iso3": "SPM", "name": "Saint Pierre and Miquelon", "capital": "Saint-Pierre"},
    {"iso2": "RE", "iso3": "REU", "name": "Réunion", "capital": "Saint-Denis"},
    {"iso2": "SH", "iso3": "SHN", "name": "Saint Helena, Ascension and Tristan da Cunha", "capital": "Jamestown"},
    {"iso2": "WF", "iso3": "WLF", "name": "Wallis and Futuna", "capital": "Mata-Utu"},
    {"iso2": "YT", "iso3": "MYT", "name": "Mayotte", "capital": "Mamoudzou"},
    {"iso2": "GI", "iso3": "GIB", "name": "Gibraltar", "capital": "Gibraltar"},
    {"iso2": "BM", "iso3": "BMU", "name": "Bermuda", "capital": "Hamilton"},
    {"iso2": "KY", "iso3": "CYM", "name": "Cayman Islands", "capital": "George Town"},
    {"iso2": "VG", "iso3": "VGB", "name": "British Virgin Islands", "capital": "Road Town"},
    {"iso2": "TC", "iso3": "TCA", "name": "Turks and Caicos Islands", "capital": "Cockburn Town"},
    {"iso2": "AW", "iso3": "ABW", "name": "Aruba", "capital": "Oranjestad"},
    {"iso2": "CW", "iso3": "CUW", "name": "Curaçao", "capital": "Willemstad"},
    {"iso2": "SX", "iso3": "SXM", "name": "Sint Maarten", "capital": "Philipsburg"},
    {"iso2": "MF", "iso3": "MAF", "name": "Saint Martin", "capital": "Marigot"},
    {"iso2": "BL", "iso3": "BLM", "name": "Saint Barthélemy", "capital": "Gustavia"},
    {"iso2": "NC", "iso3": "NCL", "name": "New Caledonia", "capital": "Nouméa"},
    {"iso2": "PF", "iso3": "PYF", "name": "French Polynesia", "capital": "Papeete"},
    {"iso2": "FO", "iso3": "FRO", "name": "Faroe Islands", "capital": "Tórshavn"},
    {"iso2": "GL", "iso3": "GRL", "name": "Greenland", "capital": "Nuuk"},
    {"iso2": "PR", "iso3": "PRI", "name": "Puerto Rico", "capital": "San Juan"},
    {"iso2": "GU", "iso3": "GUM", "name": "Guam", "capital": "Hagåtña"},
    {"iso2": "AS", "iso3": "ASM", "name": "American Samoa", "capital": "Pago Pago"},
    {"iso2": "VI", "iso3": "VIR", "name": "US Virgin Islands", "capital": "Charlotte Amalie"},
    {"iso2": "NR", "iso3": "NRU", "name": "Nauru", "capital": "Yaren"},
    {"iso2": "SO", "iso3": "SOM", "name": "Somalia", "capital": "Mogadishu"},
    {"iso2": "SY", "iso3": "SYR", "name": "Syria", "capital": "Damascus"},
    {"iso2": "RU", "iso3": "RUS", "name": "Russia", "capital": "Moscow"},
    {"iso2": "VN", "iso3": "VNM", "name": "Vietnam", "capital": "Hanoi"},
    {"iso2": "BN", "iso3": "BRN", "name": "Brunei", "capital": "Bandar Seri Begawan"},
]


def slugify(value: str) -> str:
    value = value.lower().replace("é", "e").replace("è", "e").replace("ô", "o").replace("ç", "c").replace("ã", "a").replace("í", "i")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def clean(name: str) -> str:
    return WB_NAME_FIX.get(name, name)


def main() -> None:
    wb = json.loads((Path("/tmp/wb-countries.json")).read_text())[1]
    gov = json.loads(Path("/tmp/govuk-index.json").read_text())
    by_iso: dict[str, dict] = {}

    for row in wb:
        region = (row.get("region") or {}).get("id")
        iso2 = (row.get("iso2Code") or "").upper()
        iso3 = row.get("id") or ""
        if region in {None, "NA"} or len(iso2) != 2 or not iso2.isalpha() or iso2 in SKIP_ISO2:
            continue
        name = clean(row.get("name") or iso2)
        by_iso[iso2] = {
            "iso2": iso2,
            "iso3": iso3,
            "name": name,
            "capital": row.get("capitalCity") or "",
            "slug": slugify(name),
            "govuk_slug": None,
            "aliases": [],
        }

    for extra in EXTRA:
        current = by_iso.get(extra["iso2"])
        if current:
            current["name"] = extra["name"]
            current["iso3"] = extra["iso3"]
            current["slug"] = slugify(extra["name"])
            if extra.get("capital"):
                current["capital"] = extra["capital"]
        else:
            by_iso[extra["iso2"]] = {
                **extra,
                "slug": slugify(extra["name"]),
                "govuk_slug": None,
                "aliases": [],
            }

    gov_rows = []
    for child in gov["links"]["children"]:
        country = (child.get("details") or {}).get("country") or {}
        slug = country.get("slug")
        name = country.get("name")
        synonyms = country.get("synonyms") or []
        if slug and name:
            gov_rows.append((slug, name, synonyms))

    name_to_iso = {slugify(item["name"]): item["iso2"] for item in by_iso.values()}
    for item in by_iso.values():
        name_to_iso[item["iso2"].lower()] = item["iso2"]

    unmatched = []
    for slug, name, synonyms in gov_rows:
        iso2 = SLUG_ISO2.get(slug) or name_to_iso.get(slug) or name_to_iso.get(slugify(name))
        if not iso2 or iso2 not in by_iso:
            unmatched.append((slug, name))
            continue
        item = by_iso[iso2]
        item["govuk_slug"] = slug
        item["slug"] = slug
        aliases = set(item.get("aliases") or [])
        aliases.update(synonyms)
        if name != item["name"]:
            aliases.add(name)
        item["aliases"] = sorted(a for a in aliases if a and a != item["name"])

    catalog = []
    for iso2, item in sorted(by_iso.items(), key=lambda pair: pair[1]["name"].lower()):
        cur = CURRENCY.get(iso2)
        catalog.append({
            "iso2": iso2,
            "iso3": item["iso3"],
            "name": item["name"],
            "slug": item["slug"],
            "govuk_slug": item.get("govuk_slug") or "",
            "capital": item.get("capital") or "",
            "currency": cur[0] if cur else "",
            "currency_name": cur[1] if cur else "",
            "languages": LANGUAGES.get(iso2) or [],
            "driving": "left" if iso2 in LEFT_DRIVE else "right",
            "aliases": sorted({*(item.get("aliases") or []), *ALIASES_EXTRA.get(iso2, [])} - {item["name"]}),
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"
    OUT.write_text(text)
    WEB_OUT.parent.mkdir(parents=True, exist_ok=True)
    WEB_OUT.write_text(text)
    MOBILE_OUT.parent.mkdir(parents=True, exist_ok=True)
    MOBILE_OUT.write_text(text)
    with_govuk = sum(1 for item in catalog if item["govuk_slug"])
    print(f"wrote {len(catalog)} countries ({with_govuk} with GOV.UK slugs) -> {OUT}")
    if unmatched:
        print("unmatched GOV.UK", unmatched)


if __name__ == "__main__":
    main()
