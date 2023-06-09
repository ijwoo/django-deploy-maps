function showPreview(event) {
  var card = event.currentTarget;
  var preview = card.querySelector(".preview");
  
  // 미리보기 창의 위치를 조정
  preview.style.left = event.pageX + 10 + "px";
  preview.style.top = event.pageY - window.scrollY + 10 + "px";
  
  // 미리보기 창을 보이게 함
  preview.style.display = "block";
}

function hidePreview(event) {
  var card = event.currentTarget;
  var preview = card.querySelector(".preview");
  
  // 미리보기 창을 숨김
  preview.style.display = "none";
}
