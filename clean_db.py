import sqlite3

conn = sqlite3.connect('backend/app.db')
c = conn.cursor()

c.execute('SELECT id FROM bookings WHERE id >= 12')
test_bookings = [r[0] for r in c.fetchall()]
print('Test bookings to delete:', test_bookings)

if test_bookings:
    placeholders = ','.join(['?']*len(test_bookings))
    c.execute(f"DELETE FROM audit_logs WHERE resource_type = 'Booking' AND resource_id IN ({placeholders})", test_bookings)
    c.execute(f"DELETE FROM bookings WHERE id IN ({placeholders})", test_bookings)
    conn.commit()
    print(f'Deleted {len(test_bookings)} test bookings and associated audit logs')

c.execute("SELECT count(*), sum(case when cancellation_prediction_source = 'ML_LIVE' then 1 else 0 end), sum(case when cancellation_prediction_source = 'ML_BACKFILL' then 1 else 0 end), sum(case when cancellation_probability IS NULL then 1 else 0 end) FROM bookings")
res = c.fetchone()
print(f'Total bookings: {res[0]}')
print(f'Live predictions: {res[1] or 0}')
print(f'Backfilled predictions: {res[2] or 0}')
print(f'Bookings without prediction: {res[3] or 0}')

conn.close()
