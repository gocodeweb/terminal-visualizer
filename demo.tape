Output demo.gif

Set Shell "bash"
Set FontSize 14
Set Width 900
Set Height 500
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 20ms

Type "# Terminal Visualizer — pixel-perfect charts in your terminal"
Enter
Sleep 1s

Type@40ms "echo 'bar-chart:'"
Enter
Type@40ms "terminal-visualizer --static <<'EOF'"
Enter
Type '{"type":"bar-chart","title":"Revenue ($M)","data":[{"label":"Q1","value":120,"color":"blue"},{"label":"Q2","value":185,"color":"teal"},{"label":"Q3","value":210,"color":"green"},{"label":"Q4","value":280,"color":"amber"}]}'
Enter
Type "EOF"
Enter
Sleep 2s

Type@40ms "echo 'flow-diagram:'"
Enter
Type@40ms "terminal-visualizer --static <<'EOF'"
Enter
Type '{"type":"flow-diagram","title":"Architecture","nodes":[{"id":"gw","label":"Gateway","color":"blue"},{"id":"api","label":"API","color":"teal"},{"id":"db","label":"Database","color":"green"}],"edges":[{"from":"gw","to":"api","label":"route"},{"from":"api","to":"db","label":"query"}]}'
Enter
Type "EOF"
Enter
Sleep 2s

Type@40ms "echo 'Install: npm i -g terminal-visualizer'"
Enter
Type@40ms "echo 'Skill:   npx skills add gocodeweb/terminal-visualizer'"
Enter
Sleep 2s
