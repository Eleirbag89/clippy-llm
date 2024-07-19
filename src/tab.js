
document.addEventListener('DOMContentLoaded', function () {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    console.log("AAAAA", tabs, contents);
  
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
  
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
  
        contents.forEach(content => {
          if (content.id === target) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });
      });
    });
  });
  