"""Dos grupos de usuarios virtuales, uno por servidor ASIS."""
from backend_locust import BackendASISUser
from frontend_locust import FrontendASISUser

# Ejemplo: locust -f qa/locust/mixto_locust.py --headless -u 8 -r 2 -t 45s
# Ambos hosts se declaran en sus respectivas clases.
