"""Data platform: raw archive, database, collectors and models for the crypto and global-markets research terminal.

Start with docs/architecture.md. The layers live in:
    core/        shared plumbing: settings, raw store, database, HTTP client, collector runner
    collectors/  one package per data source
    models/      one plug-in folder per model, plus the framework and registry
    jobs/        command-line entry points the scheduler calls
"""
