# Feature List

This is basically list of high level feature prompts that i am using to guide ai to add new features. I plan on getting better and I am recording here, so i can come back and study this.

[...] Missed a few :P [...]

### 001_History Page

Problem Definition: The user needs a historical chats page to view previous chat and open them and continue their conversation thread because they disappear on clicking new chat (plus icon) and user cannot interact with them.

Solution that i am thinking of:

Steps:
  0. On the first message, post response, make an api call to generate a title for the chat.
  1. Refactor the project to separate messages from ChatScreen.
  2. Start saving the messages in an array of max size 30. Recent messages should always be first and rotate the list usage.
  3. Then add history (clock-like) icon in the menu bar. top-left.
  4. Then use the separated messages array to populate the historical page in list view. Show the title of the chat here.
  5. Then add click functionality to it. On-click it should open ChatScreen with that specific chat thread. 


### 002_Upload Image

Problem Defintion: I need to be able to upload images to the chat to send the them to the model because the model can understand them and assist users visually

Solution that I am thinking of is:

Steps:
  1. Add a paper clip icon to the left of the input text field


### 003_Regenerate Reply Option

### 004_Copy any message

### 005_Edit any message
