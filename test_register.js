const payload = {
    username: "debug_node_user_" + Math.floor(Math.random() * 10000),
    password: "password123"
};

console.log('Sending registration request for:', payload.username);

fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
    .then(async res => {
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    })
    .catch(err => console.error('Fetch Error:', err));
