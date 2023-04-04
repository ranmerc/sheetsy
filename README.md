building 🔨
https://stackoverflow.com/a/4566583
https://www.youtube.com/watch?v=0N6M5BBe9AE
https://supabase.com/docs/guides/auth/managing-user-data
https://stackoverflow.com/questions/66739797/how-to-handle-a-post-request-in-next-js
https://stackoverflow.com/questions/9882284/looping-through-array-and-removing-items-without-breaking-for-loop

constraints -
headers should be unique
headers should not be empty
filter queries are "AND"
raw value not trimmed
at least 1 filter required for patching

will return-
empty array - headers not unique, headers empty
insertion will not happen if header row set before inserting
deletion will not happen if header row is not set

?filter=[key]value
