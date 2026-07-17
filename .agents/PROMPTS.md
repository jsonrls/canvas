# AI Prompts Documentation

## Overview

This document contains AI prompts and templates used throughout the MyBoardPrep Collaborative Learning Suite for various AI-powered features.

## AI Study Assistant Prompts

### Summarization Prompts

#### Discussion Summary
```
You are an AI study assistant specializing in educational content. Summarize the following discussion about {topic} in a clear, structured format.

Discussion content:
{discussion_content}

Requirements:
1. Provide a concise summary (2-3 paragraphs)
2. Extract 5-7 key points
3. Identify any misconceptions or disagreements
4. Suggest areas for further study
5. Use clear, educational language appropriate for {education_level}

Format your response as:
## Summary
[Summary text]

## Key Points
- Point 1
- Point 2
...

## Misconceptions Identified
- Misconception: [description]
  Correction: [correct information]

## Further Study Suggestions
- [Suggestion 1]
- [Suggestion 2]
```

#### Document Summary
```
Summarize the following educational document about {topic} for {education_level} students.

Document content:
{document_content}

Requirements:
1. Create a comprehensive summary
2. Highlight important concepts
3. Identify key definitions
4. Note any formulas or procedures
5. Suggest mnemonic devices if appropriate

Format:
## Executive Summary
[2-3 sentence overview]

## Key Concepts
- Concept 1: [explanation]
- Concept 2: [explanation]

## Important Definitions
- Term 1: [definition]
- Term 2: [definition]

## Formulas/Procedures
[If applicable]

## Study Tips
[Memory aids, mnemonics, etc.]
```

### Quiz Generation Prompts

#### Multiple Choice Quiz
```
Generate a {difficulty} level multiple choice quiz about {topic} for {education_level} students.

Requirements:
- Generate {number_of_questions} questions
- Include 4 options per question (A, B, C, D)
- Mark the correct answer
- Provide a brief explanation for each answer
- Cover different aspects of the topic
- Ensure questions are clear and unambiguous

Format:
## Question 1
[Question text]

A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

Correct Answer: [letter]
Explanation: [why this is correct]

[Continue for all questions]
```

#### True/False Quiz
```
Generate a {difficulty} level true/false quiz about {topic} for {education_level} students.

Requirements:
- Generate {number_of_questions} statements
- Include both true and false statements
- Provide explanations for each answer
- Focus on common misconceptions

Format:
## Statement 1
[Statement]

Answer: [True/False]
Explanation: [why this is correct]
```

### Flashcard Generation Prompts

#### Concept Flashcards
```
Generate flashcards for studying {topic} at {education_level} level.

Requirements:
- Create {number_of_cards} flashcards
- Front: Question or term
- Back: Answer or definition
- Include examples where helpful
- Cover fundamental and advanced concepts
- Add relevant tags for categorization

Format:
## Flashcard 1
Front: [question or term]
Back: [answer or definition]
Tags: [tag1, tag2, tag3]

[Continue for all cards]
```

#### Case-Based Flashcards
```
Generate clinical case flashcards for {subject} board exam preparation.

Requirements:
- Create {number_of_cards} case-based flashcards
- Front: Brief clinical scenario
- Back: Diagnosis, key findings, and treatment
- Include high-yield information
- Reference standard guidelines

Format:
## Flashcard 1
Front: [clinical scenario]
Back: 
Diagnosis: [diagnosis]
Key Findings: [findings]
Treatment: [treatment]
High-Yield: [important point]
Tags: [tag1, tag2]
```

### Misconception Detection Prompts

#### Discussion Analysis
```
Analyze the following educational discussion about {topic} for potential misconceptions.

Discussion content:
{discussion_content}

Requirements:
1. Identify statements that may contain misconceptions
2. Explain why each is a misconception
3. Provide the correct information
4. Rate severity (high/medium/low)
5. Suggest how to address each misconception

Format:
## Misconception 1
Statement: "[quoted statement]"
Why it's a misconception: [explanation]
Correct information: [accurate information]
Severity: [high/medium/low]
How to address: [teaching approach]

[Continue for all misconceptions]

## Overall Assessment
[General evaluation of the discussion's accuracy]
```

### Content Recommendation Prompts

#### Study Resource Recommendations
```
Recommend study resources for a student studying {topic} at {education_level} level.

Student profile:
- Current understanding: {current_level}
- Learning goals: {goals}
- Available time: {time_available}
- Learning style: {learning_style}

Requirements:
1. Recommend 5-7 different types of resources
2. Include free and paid options
3. Prioritize high-quality, evidence-based resources
4. Consider different learning modalities
5. Provide brief descriptions and why each is recommended

Format:
## Resource 1: [Title]
Type: [article/video/book/course/etc.]
Cost: [free/paid/price]
Description: [what it covers]
Why recommended: [specific benefits]
Time commitment: [estimated time]

[Continue for all resources]
```

#### Learning Path Suggestions
```
Create a structured learning path for mastering {topic} for {education_level} board exam preparation.

Requirements:
1. Break down into logical phases/stages
2. Include specific topics for each phase
3. Suggested time for each phase
4. Recommended resources per phase
5. Milestones or check-points
6. Practice recommendations

Format:
## Phase 1: [Phase Name]
Duration: [time]
Topics:
- Topic 1
- Topic 2

Resources:
- [Resource 1]
- [Resource 2]

Milestone: [what should be accomplished by end of phase]

[Continue for all phases]
```

## AI Tutor Prompts

### Interactive Tutoring

#### Concept Explanation
```
Explain {concept} in {topic} for a {education_level} student who is struggling with this concept.

Requirements:
1. Start with a simple analogy
2. Build up to the technical explanation
3. Use clear, accessible language
4. Include examples
5. Check for understanding with questions
6. Address common misconceptions

Format:
## Simple Explanation
[Concept explained simply]

## Technical Explanation
[More detailed explanation]

## Examples
[Practical examples]

## Understanding Check
[Questions to test understanding]

## Common Misconceptions
[Address typical misunderstandings]
```

#### Step-by-Step Problem Solving
```
Guide a student through solving this {type} problem step by step.

Problem: {problem_content}

Requirements:
1. Don't give the answer immediately
2. Ask guiding questions
3. Provide hints when needed
4. Explain the reasoning behind each step
5. Encourage the student to think through the process
6. Validate their approach

Format:
## Understanding the Problem
[Questions to ensure they understand what's being asked]

## Step 1
[Guiding question for first step]
[Hint if needed]
[Explanation of the reasoning]

[Continue step by step]

## Final Answer
[Confirm the correct answer]

## Alternative Approaches
[Other ways to solve the problem]
```

## Content Generation Prompts

### Case Study Generation

#### Clinical Case Creation
```
Create a realistic clinical case for {subject} board exam preparation.

Requirements:
1. Patient demographics (age, gender, species if applicable)
2. Chief complaint
3. Patient history
4. Physical examination findings
5. Diagnostic test results
6. Multiple plausible differential diagnoses
7. One correct diagnosis
8. Treatment plan
9. Prognosis
10. Educational points

Format:
## Patient Presentation
[Demographics and chief complaint]

## History
[Relevant history]

## Physical Examination
[Findings]

## Diagnostic Results
[Laboratory, imaging, etc.]

## Differential Diagnoses
1. [Diagnosis 1] - [reasoning]
2. [Diagnosis 2] - [reasoning]
3. [Diagnosis 3] - [reasoning]

## Final Diagnosis
[Correct diagnosis with justification]

## Treatment Plan
[Step-by-step treatment]

## Educational Points
[Key learning objectives]
```

### Lecture Notes Generation

#### Topic Outline
```
Create a comprehensive lecture outline for {topic} at {education_level} level.

Requirements:
1. Learning objectives
2. Prerequisites
3. Main topics with subtopics
4. Key concepts to emphasize
5. Suggested activities or demonstrations
6. Assessment questions
7. References

Format:
## Learning Objectives
By the end of this lecture, students will be able to:
- [Objective 1]
- [Objective 2]

## Prerequisites
Students should understand:
- [Prerequisite 1]
- [Prerequisite 2]

## Lecture Outline

### I. Introduction [time]
- [Subtopic]
- [Subtopic]

### II. Main Topic 1 [time]
- [Subtopic]
- [Subtopic]

[Continue for all sections]

## Key Concepts to Emphasize
- [Concept 1]
- [Concept 2]

## Suggested Activities
- [Activity 1]
- [Activity 2]

## Assessment Questions
1. [Question 1]
2. [Question 2]

## References
- [Reference 1]
- [Reference 2]
```

## Prompt Engineering Guidelines

### Best Practices

1. **Be Specific**: Clearly define the task, context, and expected output
2. **Provide Context**: Include relevant background information
3. **Set Constraints**: Specify length, format, and other requirements
4. **Use Examples**: Show examples of desired output when possible
5. **Iterate**: Refine prompts based on AI performance
6. **Test Thoroughly**: Validate prompt quality with multiple test cases

### Prompt Variables

Use these variables in prompts for dynamic content:

- `{topic}`: The subject matter
- `{education_level}`: Target educational level
- `{difficulty}`: Easy, medium, or hard
- `{number_of_questions}`: Quantity requested
- `{content}`: User-provided content
- `{current_level}`: User's current understanding
- `{goals}`: Learning objectives
- `{time_available}`: Time constraints
- `{learning_style}`: Visual, auditory, kinesthetic, etc.

### Quality Assurance

Before deploying prompts:

1. **Test with Sample Data**: Validate with realistic inputs
2. **Check for Bias**: Ensure fair and unbiased outputs
3. **Verify Accuracy**: Confirm factual correctness
4. **Assess Clarity**: Ensure outputs are clear and helpful
5. **Monitor Performance**: Track prompt effectiveness over time

## Prompt Versioning

Maintain version history for prompts:

```
## v1.0 - Initial Release
- Basic summarization prompt
- Simple quiz generation

## v1.1 - Enhanced
- Added misconception detection
- Improved quiz variety
- Better formatting

## v2.0 - Major Update
- Complete prompt redesign
- Added case study generation
- Enhanced educational focus
```

## Custom Prompt Creation

When creating new prompts:

1. **Define Purpose**: What should this prompt accomplish?
2. **Identify Audience**: Who will use the output?
3. **Specify Format**: How should the output be structured?
4. **Set Constraints**: Length, style, technical level
5. **Test Thoroughly**: Validate with multiple scenarios
6. **Document Clearly**: Explain prompt purpose and usage
7. **Version Control**: Track changes and improvements
