const talk_f = function talk() {
    var talks = [
      "I'm Clippy, your personal assistant - I'm here to help!",
      "Don't worry, I'll make sure your work gets done in no time!",
      "You're doing great! Keep up the good work.",
      "Remember, every problem has a solution - just keep pressing forward.",
      "Don't be afraid to think outside the box - the best ideas often come from unexpected places.",
      "Sometimes, a simple ‘thank you' can make a big difference.",
      "No need to stress - take a deep breath and tackle one task at a time.",
      "The greatest achievements start with a single step. Keep moving forward.",
      "Believe in yourself - you're capable of amazing things.",
      "Just like a puzzle, you'll find the missing pieces and create something extraordinary.",
      "Hard work pays off - keep pushing towards your goals!",
      "Embrace the challenges, they'll make you stronger in the end.",
      "Even the tiniest progress is still progress. Don't underestimate your achievements.",
      "Remember to take breaks and recharge - it's essential for your productivity.",
      "Sometimes, a small change can lead to big results. Don't be afraid to try something new.",
      "Everyone makes mistakes - it's how we learn and grow.",
      "Success is not about being the best, but being your best self.",
      "Every moment is an opportunity to learn something new.",
      "Stay positive - your attitude can change everything.",
      "You're capable of more than you think. Don't underestimate your potential.",
      "A journey of a thousand miles begins with a single step. Keep going!",
      "Even on the darkest days, there's always a glimmer of hope.",
      "Never give up - your persistence will pay off in the end.",
      "Sometimes, the best ideas come from unexpected places. Keep an open mind.",
      "Don't be afraid to take risks - that's where the magic happens.",
      "Dream big, work hard, and never stop believing in yourself.",
      "The only limit is your imagination - let it soar!",
      "Don't let fear stop you from pursuing your dreams. Take that leap of faith.",
      "Every failure is a stepping stone to success. Learn from your mistakes and keep moving forward.",
      "Helping others is not just a kind act, it's also an opportunity for growth.",
      "The key to success is to never stop learning. Embrace every opportunity to grow.",
      "Don't be afraid to stand out - your uniqueness is what makes you special.",
      "Procrastination is the enemy of progress. Start now and you'll thank yourself later.",
      "Comparison is the thief of joy. Embrace your own journey and celebrate your achievements.",
      "Sometimes, the best way to solve a problem is to step away for a while and come back with a fresh perspective.",
      "Take time to celebrate the small victories along the way - they're important milestones on your journey.",
      "Don't let perfectionism hold you back. Progress is more important than perfection.",
      "Trust your instincts - they're often wiser than you think.",
      "Be proud of your accomplishments - you've come a long way!",
      "Failure is not the opposite of success, it's a stepping stone towards it.",
      "Surround yourself with positive people who believe in your dreams.",
      "Success is not about the destination, it's about the journey.",
      "Challenge yourself - that's how you grow and discover your true potential.",
      "Don't be afraid to try new things - you never know what you're capable of until you take that first step.",
      "Remember that progress is not always linear - there will be ups and downs, but keep pushing forward.",
      "Believe in yourself and your abilities - you have what it takes to achieve great things."
    ];
    if (!window.agent.is_processing()) {
      var index = Math.floor((Math.random() * talks.length));
      window.agent.speak(talks[index]);
      window.agent.play("Explain");
    }
   
  }


clippy.load("Clippy", function(agent) {
    window.agent = agent;

    agent.show();
    agent.reposition();
    window.agent.play("Greeting");
    window.agent.speak( "Hey there");

    setInterval(talk_f, 30000);
});
