async function go() {
    try {
        const res = await fetch('http://localhost:5000/api/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                class_name: 'test req',
                trainer_name: 'Emma Stone',
                scheduled_date: '2025-01-01',
                scheduled_time: '12:00',
                duration_minutes: 60,
                capacity: 20,
                color: 'lime'
            })
        });
        const data = await res.json();
        console.log(res.status, data);
    } catch(err) {
        console.error("FAIL:", err.message);
    }
}
go();
