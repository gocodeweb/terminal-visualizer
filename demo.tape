Output demo.gif

Set Shell "bash"
Set FontSize 14
Set Width 1200
Set Height 700
Set Padding 20
Set Theme "Catppuccin Mocha"

# Title
Type "# Terminal Visualizer — Interactive charts, diagrams & more in your terminal"
Enter
Sleep 1s

# Bar Chart demo
Type "terminal-visualizer <<'EOF'"
Enter
Type '{"type":"bar-chart","title":"Cloud Revenue by Quarter ($M)","data":[{"label":"Q1","value":120,"color":"blue"},{"label":"Q2","value":185,"color":"teal"},{"label":"Q3","value":210,"color":"green"},{"label":"Q4","value":280,"color":"amber"}]}'
Enter
Type "EOF"
Enter
Sleep 3s
# Navigate
Down
Sleep 500ms
Down
Sleep 500ms
Down
Sleep 500ms
# Select Q4
Enter
Sleep 2s

# Heatmap demo
Type "terminal-visualizer <<'EOF'"
Enter
Type '{"type":"heatmap","title":"Git Commit Activity by Day & Hour","xLabels":["6a","8a","10a","12p","2p","4p","6p","8p","10p"],"yLabels":["Mon","Tue","Wed","Thu","Fri"],"data":[[3,5,12,8,13,16,6,4,2],[4,6,15,20,35,23,9,6,5],[6,10,19,28,31,18,15,9,4],[1,4,11,16,20,10,4,16,34],[1,2,4,5,9,12,9,4,5]],"colorRamp":"green"}'
Enter
Type "EOF"
Enter
Sleep 3s
Right
Sleep 300ms
Right
Sleep 300ms
Right
Sleep 300ms
Down
Sleep 300ms
Down
Sleep 300ms
# Quit
Type "q"
Sleep 2s

# Flow diagram demo
Type "terminal-visualizer <<'EOF'"
Enter
Type '{"type":"flow-diagram","title":"Microservice Architecture","nodes":[{"id":"gw","label":"API Gateway","description":"Routes requests","color":"blue"},{"id":"auth","label":"Auth Service","description":"JWT validation","color":"purple"},{"id":"users","label":"User Service","color":"teal"},{"id":"orders","label":"Order Service","color":"green"},{"id":"db","label":"PostgreSQL","description":"Primary DB","color":"amber"},{"id":"cache","label":"Redis","description":"Session cache","color":"red"}],"edges":[{"from":"gw","to":"auth","label":"verify"},{"from":"gw","to":"users"},{"from":"gw","to":"orders"},{"from":"auth","to":"cache","label":"sessions"},{"from":"users","to":"db","label":"query"},{"from":"orders","to":"db","label":"query"}]}'
Enter
Type "EOF"
Enter
Sleep 3s
Right
Sleep 500ms
Right
Sleep 500ms
Right
Sleep 500ms
Enter
Sleep 2s

# Sequence diagram demo
Type "terminal-visualizer <<'EOF'"
Enter
Type '{"type":"sequence-diagram","title":"OAuth2 Login Flow","actors":[{"id":"user","label":"Browser","color":"blue"},{"id":"app","label":"App Server","color":"teal"},{"id":"auth","label":"Google Auth","color":"purple"}],"messages":[{"from":"user","to":"app","label":"Click Login"},{"from":"app","to":"auth","label":"Redirect /authorize"},{"from":"auth","to":"user","label":"Consent screen"},{"from":"user","to":"auth","label":"Grant"},{"from":"auth","to":"app","label":"Auth code","style":"dashed"},{"from":"app","to":"auth","label":"Exchange for token"},{"from":"auth","to":"app","label":"Access token","style":"dashed"},{"from":"app","to":"user","label":"Logged in!"}]}'
Enter
Type "EOF"
Enter
Sleep 3s
Down
Sleep 400ms
Down
Sleep 400ms
Down
Sleep 400ms
Down
Sleep 400ms
Type "q"
Sleep 2s

Type "# Install: npm i -g terminal-visualizer && npx skills add gocodeweb/terminal-visualizer"
Enter
Sleep 3s
