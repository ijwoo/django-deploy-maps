function addAddressInput() {
    var addressCount = document.querySelectorAll('.coordinate-input').length;

    // 주소 입력란이 2개 유지
    if (addressCount >= 2 && addressCount < 5) {
        var inputContainer = document.querySelector('.additional-info .input-container');
        var newInputRow = document.createElement('div');
        newInputRow.classList.add('input-row');

        var newInput = document.createElement('input');
        newInput.setAttribute('type', 'text');
        newInput.setAttribute('name', 'coordinate-input');
        newInput.classList.add('coordinate-input');
        newInput.placeholder = '여기에 주소를 입력하세요!';

        var removeButton = document.createElement('button');
        removeButton.classList.add('remove-button');
        removeButton.textContent = '삭제';
        removeButton.setAttribute('onclick', 'removeAddressInput(this)');

        newInputRow.appendChild(newInput);
        newInputRow.appendChild(removeButton);
        inputContainer.appendChild(newInputRow);
    }
}

function removeAddressInput(button) {
    var inputRow = button.parentNode;
    var addressCount = document.querySelectorAll('.coordinate-input').length;

    // 주소 입력란이 2개 이상일 때만 삭제되도록 제한
    if (addressCount > 2) {
        inputRow.parentNode.removeChild(inputRow);
    }
}