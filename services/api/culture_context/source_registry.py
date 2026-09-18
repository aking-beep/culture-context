SOURCES = {
    "govuk": {
        "authority": "UK Foreign, Commonwealth & Development Office",
        "class": "government_advisory",
        "machine_readable": True,
        "refresh": "6h",
    },
    "state_dept": {
        "authority": "U.S. Department of State",
        "class": "government_advisory",
        "machine_readable": "rss/pages",
        "refresh": "1h",
    },
    "gdacs": {
        "authority": "Global Disaster Alert and Coordination System",
        "class": "intergovernmental_alert",
        "machine_readable": True,
        "refresh": "15m",
    },
    "reliefweb": {
        "authority": "UN OCHA ReliefWeb",
        "class": "intergovernmental_alert",
        "machine_readable": True,
        "refresh": "1h",
    },
}
