// Accountant Form Handling
document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cadastrando...';

    const formData = {
        clientName: document.getElementById('clientName').value,
        street: document.getElementById('street').value,
        number: document.getElementById('number').value,
        neighborhood: document.getElementById('neighborhood').value,
        priority: document.querySelector('input[name="priority"]:checked').value,
        documents: document.getElementById('documents').value
            .split(',')
            .map(d => d.trim())
            .filter(d => d)
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Documento cadastrado com sucesso!');
            document.getElementById('orderForm').reset();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erro no cadastro');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`Erro ao cadastrar documento: ${error.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cadastrar Entrega';
    }
});

// Form validation
document.querySelectorAll('#orderForm input[required]').forEach(input => {
    input.addEventListener('blur', () => {
        if (!input.value) {
            input.classList.add('border-red-500');
        } else {
            input.classList.remove('border-red-500');
        }
    });
});
