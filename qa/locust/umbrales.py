"""Indica error si se sobrepasan los umbrales tras las pruebas Locust."""
import os
from locust import events


@events.quitting.add_listener
def comprobar_umbrales(environment, **kwargs):
    total = environment.stats.total
    if total.num_requests == 0:
        environment.process_exit_code = 1
        return
    p95 = total.get_response_time_percentile(0.95) or 0
    fallos_max = float(os.getenv('ASIS_QA_MAX_FAIL_RATIO', '0.03'))
    p95_max = float(os.getenv('ASIS_QA_MAX_P95_MS', '2000'))
    if total.fail_ratio > fallos_max or p95 > p95_max:
        environment.process_exit_code = 1
