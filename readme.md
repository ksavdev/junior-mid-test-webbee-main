# Webbee Javascript challenge 2025
Dear applicant,

Thank you for applying at Webbee!

This challenge is designed to test your data structures skills which transfer to all domains: Frontend and Backend. 

It is designed to be challenging and educational. No matter if you are joining Webbee or not - after completing this challenge, You will have learned a lot and advanced your development career by a couple steps.
So no matter if it is challenging, don't give up. This test is less about "getting the job" and more about learning what it takes to be a top 10 % developer.
However, if you complete the test successfully you have a very good chance of getting the job since very few candidates make it.

I wish you all the best.

Tobias, CEO & CTO @ Webbee

## Getting started
1. [Download the code](https://github.com/Mythli/junior-mid-test-webbee/archive/refs/heads/main.zip)
2. Read the requirements carefully! Remember Einstein: If I had an hour to solve a problem I'd spend 55 minutes thinking about the problem and five minutes thinking about solutions
3. Write your code in [src/index.js](/src/index.js) so it passes all tests

## Requirements
**Correct Solution Requirements**

### `smartDefaultIndexer(filter)`
Called by `splitFilters` to differentiate between smart / non smart filters (key default). Smart filters have the operator `smart`.

---

### `splitFilters(filters, splitFoo, traverseFlags)`
Should split the provided filters as per \`splitFoo\` into high level keys like `smart` and `default`. 

---

### Examples 

**Input**:
```json
{
  "conjunction": "and",
  "filtersSet": [
    {
      "operator": "smart",
      "value": "A"
    },
    {
      "conjunction": "or",
      "filtersSet": [
        {
          "operator": "contains",
          "value": "B"
        }
      ]
    },
    {
      "operator": "hasAnyOf",
      "value": [
        "cross-table",
        {
          "conjunction": "and",
          "filtersSet": [
            {
              "operator": "smart",
              "value": "C"
            }
          ]
        }
      ]
    }
  ]
}
```

**Correct Output**:
```json
{
  "smart": {
    "conjunction": "and",
    "filtersSet": [
      {
        "operator": "smart",
        "value": "A"
      },
      {
        "operator": "hasAnyOf",
        "value": [
          "cross-table",
          {
            "conjunction": "and",
            "filtersSet": [
              {
                "operator": "smart",
                "value": "C"
              }
            ]
          }
        ]
      }
    ]
  },
  "default": {
    "conjunction": "and",
    "filtersSet": [
      {
        "conjunction": "or",
        "filtersSet": [
          {
            "operator": "contains",
            "value": "B"
          }
        ]
      }
    ]
  }
}
```  

## Grading
1. Completeness (Does it work, does it do what is needed as per the requirements)
2. Code quality (is your code using best practices like DRY, has a clear structure, is easy to understand)
3. Technical interview (After you submitted your solution I will conduct a technical interview based on this code and a similar problem to see if you understand what you did)

## Submission
Create a private repo and invite [@Mythli](https://github.com/mythli)
Commit all written code to this repo.
Do not create a public repository.

## FAQ
**1. Can I use AI?**
Yeah sure no problem. Please use AI.

**2. Can I use Typescript?**
Yeah sure but its not a requirement

**3. Can I add more test cases?**
Sure, more is usually better

**4. How long can I work on it?**
As long as you want. Even if this is really hard for you and you don't give up and make it after a long time, that's a quality I'm looking for in engineers I will hire 

**5. Can I ask a friend for help?**
Yeah you can but then you will not pass the technical interview so with doing that you would waste 3 peoples time: your time, your friends time and my time.
