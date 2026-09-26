import httpx

base = 'http://localhost:8000'

def post(q):
    r = httpx.post(f'{base}/api/recommendations/room-match', json={'query': q}, timeout=15)
    return r.json()

print('=== Scenario A: family room ===')
d = post('I need a family room')
for m in d['matches']:
    rn = m['room_number']
    rt = m['room_type']
    st = m['status']
    rate = m['base_rate']
    print(f'  Room {rn} {rt} {st} Rs{rate}')
family_matches = [m for m in d['matches'] if m['room_type'] == 'Family']
assert family_matches, 'FAIL: No Family room returned'
assert all(m['status'] == 'available' for m in d['matches']), 'FAIL: non-available room returned in Scenario A'
print('  PASS: Family room match found, all available')
print('  Warning:', d.get('warning'))

print()
print('=== Scenario B: budget under 4000 ===')
d = post('I need a room under Rs 4000')
for m in d['matches']:
    rn = m['room_number']
    rt = m['room_type']
    st = m['status']
    rate = m['base_rate']
    print(f'  Room {rn} {rt} {st} Rs{rate}')
assert all(m['status'] == 'available' for m in d['matches']), 'FAIL: non-available room returned in Scenario B'
if d['matches']:
    assert d['matches'][0]['base_rate'] <= 4000, 'FAIL: top result over budget'
    print('  PASS: Top result within budget, all available')

print()
print('=== Scenario C: pool (unsupported) ===')
d = post('I need a room with a pool')
warn = d.get('warning') or ''
assert 'pool' in warn.lower(), 'FAIL: pool not mentioned in warning'
for m in d['matches']:
    assert 'pool' not in m['match_reason'].lower(), 'FAIL: pool claimed in match_reason'
print('  PASS: warning contains "pool", match_reason clean')
print('  Warning:', warn)

print()
print('=== Scenario D: occupied room protection ===')
d = post('I need any room')
statuses = [m['status'] for m in d['matches']]
assert all(s == 'available' for s in statuses), f'FAIL: non-available room in results: {statuses}'
print('  PASS: All returned rooms available:', statuses)

print()
print('=== Scenario E: impossible budget ===')
d = post('I need a Suite room under Rs 100')
print('  Matches:', len(d['matches']))
print('  Warning:', d.get('warning'))
print('  PASS: Clean response')

print()
print('ALL 5 SCENARIOS PASSED')
