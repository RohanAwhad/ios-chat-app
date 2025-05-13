# Feature List

- [x] 001_History Page
- [x] 002_Upload Image
- [ ] 003_Regenerate Reply Option
- [x] 004_Copy any message
- [ ] 005_Edit any message
- [ ] 006_Delete any message
- [ ] 007_View Sent Images
- [ ] 008_Perform Web Search
- [ ] 009_Upload PDFs
- [ ] 010_Voice Mode
- [ ] 011_Splash Screen that says "I love you Mom & Dad <3"

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

### 008_Web Search

Problem Defintion: I need a tool for the model to be able to use web search because i need it

User Story for performing websearch:
  - I ask the model a question using normal messages
  - Model decides to perform a tool call action (web search) with the a query
  - The web search function takes in the query, calls to an api and then returns the result back to the model for answer generation.

User Story for adding the websearch api key.:
  - I will open up settings page.
  - At the bottom, there will be a separator and a title saying Brave Search API Key
  - It will also have an input box, thats where user will paste their api key. Following the same style 

This is how i have the tool call in my python scripts:

```python
# ===
# Brave Search tool
# ===
@dataclasses.dataclass
class SearchResult:
    """
  Dataclass to represent the search results from Brave Search API.

  :param title: The title of the search result.
  :param url: The URL of the search result.
  :param description: A brief description of the search result.
  :param extra_snippets: Additional snippets related to the search result.
  :param markdown: A pruned and filtered markdown of the webpage (may not contain all the details).
  """
    title: str
    url: str
    description: str
    extra_snippets: list
    markdown: str

    def __str__(self) -> str:
        """
    Returns a string representation of the search result.

    :return: A string representation of the search result.
    """
        return (f"Title: {self.title}\n"
                f"URL: {self.url}\n"
                f"Description: {self.description}\n"
                f"Extra Snippets: {', '.join(self.extra_snippets)}\n"
                f"Markdown: {self.markdown}")


def search_brave(query: str, count: int = 5) -> list[SearchResult]:
    """
  Searches the web using Brave Search API and returns structured search results.

  :param query: The search query string.
  :param count: The number of search results to return.
  :return: A list of SearchResult objects containing the search results.
  """
    if not query:
        return []

    url: str = "https://api.search.brave.com/res/v1/web/search"
    headers: dict = {
        "Accept": "application/json",
        "X-Subscription-Token": os.environ.get('BRAVE_SEARCH_AI_API_KEY', '')
    }
    if not headers['X-Subscription-Token']:
        logger.error("Error: Missing Brave Search API key.")
        return []

    params: dict = {"q": query, "count": count}

    retries: int = 0
    max_retries: int = 3
    backoff_factor: int = 2

    while retries < max_retries:
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            results_json: dict = response.json()
            logger.debug('Got results')
            break
        except requests.exceptions.RequestException as e:
            logger.exception(f"HTTP Request failed: {e}, retrying...")
            retries += 1
            if retries < max_retries:
                time.sleep(backoff_factor**retries)
            else:
                return []

    async def fetch_all_markdown(urls):
        tasks = [fetch_markdown(url) for url in urls]
        return await asyncio.gather(*tasks)

    urls = [
        item.get('url', '')
        for item in results_json.get('web', {}).get('results', [])
    ]
    markdowns = asyncio.run(fetch_all_markdown(urls))

    results: List[SearchResult] = []
    for item, md in zip(
            results_json.get('web', {}).get('results', []), markdowns):
        if md is None:
            md = 'Failed to get markdown.'
        result = SearchResult(title=item.get('title', ''),
                              url=item.get('url', ''),
                              description=item.get('description', ''),
                              extra_snippets=item.get('extra_snippets', []),
                              markdown=md)
        results.append(result)
    return results


brave_search_tools = [{
    "type": "function",
    "function": {
        "name": "search_brave",
        "description":
        "Search the web using Brave Search API and returns structured search results.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "the search query string."
                },
            },
            "required": ["query"]
        }
    }
}]
```

Use this as reference


For openai curl reference

Request Example:
```bash
curl https://api.openai.com/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $OPENAI_API_KEY" \
-d '{
    "model": "gpt-4.1",
    "messages": [
        {
            "role": "user",
            "content": "What is the weather like in Paris today?"
        }
    ],
    "tools": [
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get current temperature for a given location.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "City and country e.g. Bogotá, Colombia"
                        }
                    },
                    "required": [
                        "location"
                    ],
                    "additionalProperties": false
                },
                "strict": true
            }
        }
    ]
}'
```

Response Example:
```
[{
    "id": "call_12345xyz",
    "type": "function",
    "function": {
        "name": "get_weather",
        "arguments": "{\"location\":\"Paris, France\"}"
    }
}]
```

For Anthropic:
Request Example
```bash
curl https://api.anthropic.com/v1/messages \
     --header "x-api-key: $ANTHROPIC_API_KEY" \
     --header "anthropic-version: 2023-06-01" \
     --header "content-type: application/json" \
     --data \
'{
    "model": "claude-3-7-sonnet-20250219",
    "max_tokens": 1024,
    "tools": [{
        "name": "get_weather",
        "description": "Get the current weather in a given location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state, e.g. San Francisco, CA"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "The unit of temperature, either \"celsius\" or \"fahrenheit\""
                }
            },
            "required": ["location"]
        }
    }],
    "messages": [{"role": "user", "content": "What is the weather like in San Francisco?"}]
}'
```

Respponse Example:
```
{
  "id": "msg_01Aq9w938a90dw8q",
  "model": "claude-3-7-sonnet-20250219",
  "stop_reason": "tool_use",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "<thinking>I need to call the get_weather function, and the user wants SF, which is likely San Francisco, CA.</thinking>"
    },
    {
      "type": "tool_use",
      "id": "toolu_01A09q90qw90lq917835lq9",
      "name": "get_weather",
      "input": {"location": "San Francisco, CA", "unit": "celsius"}
    }
  ]
}
```
