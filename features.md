# Feature List

- [x] 001_History Page
- [x] 002_Upload Image
- [ ] 003_Regenerate Reply Option
- [ ] 004_Copy any message
- [ ] 005_Edit any message
- [ ] 006_Delete any message
- [ ] 007_View Sent Images
- [ ] 008_Perform Web Search
- [ ] 009_Upload PDFs
- [ ] 010_Voice Mode

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

This is how i am envisioning it:
  1. Add a paper clip icon to the left of the input text field
  2. On clicking that icon, it should give me option for either camera or photos.
  3. If camera, then it should open up camera, allow me to capture a photo, perform markup actions on it, eg. draw on the image using pen. (simple ios functionality)
  4. If photos, then it should allow me to select maximum of 30 photos at a time.
  5. Once the photos are selected, or clicked, they should be previewed just above the input text field. Horizontally scrollable.
      - And they should also have a cross icon, so that i can remove them if i want to.


### 003_Regenerate Reply Option

### 004_Copy any message

Problem Defintion: I need a button to copy any message present in the conversation thread, because i want to

User Story:
  - User sends a message, or receives one from an ai
  - Beneath the message bubble, there is copy icon


### 005_Edit any message

### 006_Delete any message

### 007_View Sent images

Problem Definition: I need a view where i can press on the images i already sent which will show me image in full screen mode, and I can swipe left-right to go back or forward if multiple images.
