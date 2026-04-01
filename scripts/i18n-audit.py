import json

def flatten(d, prefix=''):
    out = {}
    for k, v in d.items():
        key = f'{prefix}.{k}' if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = v
    return out

for name in ['auth', 'common', 'trainee', 'trainer']:
    with open(f'messages/en/{name}.json') as f:
        en = flatten(json.load(f))
    with open(f'messages/pl/{name}.json') as f:
        pl = flatten(json.load(f))

    missing_pl = set(en.keys()) - set(pl.keys())
    missing_en = set(pl.keys()) - set(en.keys())
    # Flag values that are identical in PL and EN (likely untranslated)
    # Exclude: single chars, numbers, URLs, proper nouns (start with uppercase brand-like words)
    skip_identical = {'Forge', 'Google', 'RPE', 'RIR', 'kg', '%', 'Email', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'}
    untranslated = {
        k: v for k, v in pl.items()
        if k in en and v == en[k] and len(v) > 3 and v not in skip_identical
    }

    print(f'=== {name}.json ===')
    if missing_pl:
        print(f'  MISSING in PL: {sorted(missing_pl)}')
    if missing_en:
        print(f'  EXTRA in PL (not in EN): {sorted(missing_en)}')
    if untranslated:
        print(f'  POSSIBLY UNTRANSLATED (same as EN):')
        for k, v in sorted(untranslated.items()):
            print(f'    {k}: {v!r}')
    if not missing_pl and not missing_en and not untranslated:
        print('  OK')
    print()
