const talk_f = function talk() {
    var talks = [
      "You should never use it in production",
      "This code does not work in PHP 8",
      "You can use emoji ☺️",
      "You can see the output character lenght in the top",
      "You can click 'Encode' to encode the PHP code",
      "Seven character is less then 1112064",
      "The PHP mascotte is the ElePHPant",
      "You can click 'Copy' to copy the output",
      "Hey there",
  
    ];
    var index = Math.floor((Math.random() * talks.length));
    window.agent.speak(talks[index]);
    window.agent.play("Explain");
  }


clippy.load("Clippy", function(agent) {
    window.agent = agent;

    agent.show();
    window.agent.play("Greeting");
    //agent.moveTo(100, 100);

    setInterval(talk_f, 12000);
});
