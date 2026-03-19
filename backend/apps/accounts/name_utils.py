def derive_first_name(*values):
    for value in values:
        normalized = ' '.join((value or '').strip().split())
        if normalized:
            return normalized.split(' ')[0]
    return ''