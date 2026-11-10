#!/usr/init/env python3
"""
Orquestador Principal del Sistema de Pruebas Automatizadas - ASIS
Autor: QA Automation Senior Engineer
"""

import os
import sys
import subprocess
import json
from datetime import datetime
from rich.console import Console
from rich.panel import Panel

console = Console()
REPORTS_DIR = "Reportes"
os.makedirs(REPORTS_DIR, exist_ok=True)

def run_command(command, description):
    console.print(f"[bold cyan]Ejecutando:[/bold cyan] {description}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return {
        "success": result.returncode == 0,
        "stdout": result.stdout,
        "stderr": result.stderr
    }

def main():
    if len(sys.argv) < 2:
        console.print("[red]Uso: python ejecutar_pruebas.py [--todo | --backend | --frontend | --integracion | --e2e][/red]")
        sys.exit(1)

    arg = sys.argv[1]
    resultados = {}

    if arg in ["--todo", "--backend"]:
        resultados["backend"] = run_command("pytest tests/backend/unitarias -v", "Pruebas Unitarias Backend")

    if arg in ["--todo", "--frontend"]:
        # Apunta exactamente a tu carpeta FrontEnd
        resultados["frontend"] = run_command("npm --prefix ./FrontEnd test -- --run", "Pruebas Unitarias Frontend")

    if arg in ["--todo", "--integracion"]:
        resultados["integracion"] = run_command("pytest tests/backend/integracion -v", "Pruebas de Integración Backend-DB")

    if arg in ["--todo", "--e2e"]:
        resultados["e2e"] = run_command("npx playwright test tests/e2e/", "Pruebas End-to-End (Playwright)")

    # Guardar reporte JSON consolidado
    report_name = os.path.join(REPORTS_DIR, f"reporte_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    with open(report_name, "w", encoding="utf-8") as f:
        json.dump(resultados, f, indent=4, ensure_ascii=False)

    console.print(Panel(f"[bold green]¡Proceso finalizado! Reporte guardado en: {report_name}[/bold green]", expand=False))

if __name__ == "__main__":
    main()