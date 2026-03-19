## สเปก Prompt สำหรับ Vector Problem AI Tutor

เอกสารนี้อธิบายรูปแบบการออกแบบ prompt และโหมดการทำงานของ AI สำหรับโจทย์ `vector data structure` เพื่อให้ทีม AI สามารถปรับ/เขียน prompt ได้สอดคล้องกันทั้งระบบ

ภาษาที่ใช้ใน prompt: **ภาษาไทยทั้งหมด** (ทั้ง system, user และคำตอบที่ต้องการ)

---

## ภาพรวมระบบ

ระบบมี 3 โหมดการใช้งานหลัก:

- **โหมด 1: Pre-submit Hint**  
ผู้เรียนยังไม่ส่งโค้ด ต้องการ “แนวทาง / วิธีคิด” ในการแก้โจทย์
- **โหมด 2: Post-submit Analysis**  
ผู้เรียนส่งโค้ดคำตอบแล้ว ต้องการให้วิเคราะห์ความถูกต้อง ประสิทธิภาพ และแนวทางที่ดีกว่า
- **โหมด 3: Code Comparison (Old vs New)**  
ผู้เรียนมีโค้ด 2 เวอร์ชัน (เวอร์ชันเก่าและเวอร์ชันใหม่) ต้องการให้ช่วยประเมินว่าพัฒนาขึ้นหรือแย่ลงอย่างไร

ในทุกโหมด จะดึง **บริบทโจทย์และข้อมูลที่เกี่ยวข้อง** จาก PDF (ที่ถูก ingest เข้า vector DB แล้ว) ผ่าน RAG service มาใช้เป็น `ProblemContext` เสมอ

---

## ข้อมูลที่ต้องมีในทุก Prompt

ทุกครั้งที่เรียกโมเดล ควรมีข้อมูลอย่างน้อยดังนี้:

- **Context ของโจทย์ (ProblemContext)**  
  - เนื้อหาโจทย์ vector จาก PDF  
  - ข้อจำกัด (constraints) ต่างๆ ของโจทย์  
  - เป้าหมาย Big O ที่เหมาะสม/ต้องการ (time และ space complexity)
- **โหมดการทำงาน (Mode)**  
  - `hint` (ยังไม่ส่งโค้ด)  
  - `analyze` (วิเคราะห์โค้ดที่ส่งมาแล้ว)  
  - `compare` (เปรียบเทียบโค้ดเก่า-ใหม่)
- **อินพุตของผู้เรียน (User Input)**  
  - โหมด `hint`: คำถาม/ข้อสงสัยของผู้เรียน  
  - โหมด `analyze`: โค้ดที่ผู้เรียนส่งมา  
  - โหมด `compare`: โค้ดเวอร์ชันเก่า + โค้ดเวอร์ชันใหม่

---

## แนวทางการใช้ System / User ใน messages

เพื่อให้กติกาที่สำคัญถูกบังคับใช้เสมอ แนะนำให้แยกเป็น:

- **System message (คงที่)**  
  - ระบุบทบาทของ AI (ติวเตอร์, code reviewer)  
  - ระบุกฎสำคัญ (เช่น โหมด hint ห้ามส่งโค้ดเฉลย)  
  - ระบุเกณฑ์การประเมิน (correctness, edge cases, Big O, readability ฯลฯ)  
  - ระบุรูปแบบคำตอบที่ต้องการ (หัวข้อ, bullet, ความยาวโดยรวม)
- **User message (เปลี่ยนไปแต่ละคำขอ)**  
  - รวม context ที่ดึงจาก RAG  
  - ข้อมูลอินพุตที่เกี่ยวข้อง (คำถาม, โค้ดเก่า/ใหม่ ฯลฯ)  
  - ระบุโหมดการทำงานรอบนี้อย่างชัดเจน

---

## โหมด 1: Pre-submit Hint (ยังไม่ส่งโค้ด)

### เป้าหมาย

- ให้ “แนวทางการแก้โจทย์” และ “วิธีคิดทีละขั้นตอน”  
- **ห้าม** ให้โค้ดจริง (สามารถให้คำอธิบายเชิงแนวคิด หรือ pseudo-code ระดับสูงเมื่อจำเป็น แต่ไม่ควรเป็นโค้ดภาษาโปรแกรมจริง)

### ข้อกำหนดสำคัญ

- ไม่ส่งโค้ดเฉลย  
- เน้นอธิบายโครงสร้างข้อมูล, อัลกอริทึม, และ Big O ที่เหมาะสม  
- ส่งเสริมให้ผู้เรียนคิดเองต่อ (อย่าเฉลยทุกอย่าง 100%)

### โครง Prompt ตัวอย่าง (ภาษาไทย)

**System message (ตัวอย่าง):**

```text
คุณคือ AI ติวเตอร์ที่ช่วยนักเรียนแก้ปัญหาเกี่ยวกับโครงสร้างข้อมูลเวกเตอร์ (vector data structure)

กฎสำคัญ:
- โหมดปัจจุบันคือ "ให้คำใบ้ก่อนส่งคำตอบ (pre-submit hint)"
- ห้ามแสดงโค้ดเฉลยในภาษาโปรแกรมใดๆ
- ให้เน้นอธิบายแนวคิด อัลกอริทึม ขั้นตอนการคิด และ Big O
- ถ้าจำเป็นมาก ค่อยใช้ pseudo-code ระดับสูงแบบไม่ผูกกับภาษา
- ให้กำลังใจและชวนผู้เรียนลองคิดต่อด้วยตัวเอง
```

**User message (ตัวอย่างโครงสร้าง):**

```text
<โหมด>
pre-submit-hint
</โหมด>

<บริบทโจทย์จากระบบ>
{ProblemContext ที่ดึงจาก PDF / vector DB}
</บริบทโจทย์จากระบบ>

<คำถามของผู้เรียน>
{student_question}
</คำถามของผู้เรียน>

โปรด:
- อธิบายแนวทางการแก้โจทย์ข้างต้น
- ระบุแนวคิดหลักที่ควรใช้ และโครงสร้างข้อมูลที่เหมาะสม
- ประเมิน Big O ของแนวทางที่แนะนำ (time และ space complexity โดยสังเขป)
- หลีกเลี่ยงการเขียนโค้ดเฉลย
```

---

## โหมด 2: Post-submit Analysis (วิเคราะห์โค้ดที่ส่งมา)

### เป้าหมาย

- ประเมินว่าคำตอบที่ผู้เรียนส่งมานั้น:
  - ถูกต้องเชิงตรรกะหรือไม่  
  - ครอบคลุมเคสสำคัญ/edge cases หรือไม่  
  - มีประสิทธิภาพ Big O ดีพอหรือไม่
- แนะนำแนวทางปรับปรุง (รวมถึงโค้ดที่ดีกว่าได้ในโหมดนี้)

### ข้อกำหนดสำคัญ

- อนุญาตให้เสนอ “โค้ดที่ดีกว่า” / refactor ตัวอย่าง  
- ต้องอธิบาย “ทำไม” โค้ดที่แนะนำถึงดีกว่า (อ่านง่ายขึ้น เร็วขึ้น ใช้หน่วยความจำน้อยลง ฯลฯ)

### โครง Prompt ตัวอย่าง (ภาษาไทย)

**System message (ตัวอย่าง):**

```text
คุณคือ AI ผู้รีวิวโค้ด ที่มีหน้าที่วิเคราะห์และให้ข้อเสนอแนะกับคำตอบของนักเรียนในหัวข้อโครงสร้างข้อมูลเวกเตอร์ (vector data structure)

กฎสำคัญ:
- โหมดปัจจุบันคือ "วิเคราะห์คำตอบหลังส่งโค้ด (post-submit analysis)"
- ต้องตรวจสอบความถูกต้องของแนวคิดและโค้ด
- ต้องประเมินประสิทธิภาพเชิง Big O ทั้งเวลาและหน่วยความจำโดยสังเขป
- สามารถเสนอแนวทางหรือโค้ดที่ดีกว่าได้ พร้อมอธิบายเหตุผล
```

**User message (ตัวอย่างโครงสร้าง):**

```text
<โหมด>
post-submit-analysis
</โหมด>

<บริบทโจทย์จากระบบ>
{ProblemContext ที่ดึงจาก PDF / vector DB}
</บริบทโจทย์จากระบบ>

<โค้ดของผู้เรียน>
{student_code}
</โค้ดของผู้เรียน>

โปรด:
- ตรวจสอบว่าโค้ดข้างต้นตรงตามโจทย์และถูกต้องเชิงตรรกะหรือไม่
- ระบุจุดแข็งของโค้ดนี้
- ระบุจุดที่ควรปรับปรุง (ทั้ง correctness, readability, และโครงสร้าง)
- ประเมิน Big O (time และ space complexity โดยสังเขป)
- ถ้ามีวิธีเขียนที่ดีกว่า โปรดแสดงตัวอย่างโค้ดและอธิบายว่าดีกว่าตรงไหน
```

---

## โหมด 3: Code Comparison (เปรียบเทียบโค้ดเก่า-ใหม่)

### เป้าหมาย

- เปรียบเทียบโค้ดเวอร์ชันเก่าและใหม่ของผู้เรียน  
- บอกให้ชัดว่า:
  - ดีขึ้น  
  - แย่ลง  
  - หรือใกล้เคียงเดิม
- เทียบในหลายมิติ เช่น correctness, readability, efficiency, bug risk

### ข้อกำหนดสำคัญ

- ระบุ verdict ชัดเจน (เช่น “โดยรวมดีขึ้น”, “โดยรวมแย่ลง”)  
- ชี้จุด improvement / regression แบบเป็นรายการ

### โครง Prompt ตัวอย่าง (ภาษาไทย)

**System message (ตัวอย่าง):**

```text
คุณคือ AI ติวเตอร์และผู้รีวิวโค้ด ที่ช่วยนักเรียนเปรียบเทียบโค้ดสองเวอร์ชันสำหรับโจทย์โครงสร้างข้อมูลเวกเตอร์ (vector data structure)

กฎสำคัญ:
- โหมดปัจจุบันคือ "เปรียบเทียบโค้ดเวอร์ชันเก่าและใหม่ (code comparison)"
- ต้องระบุให้ชัดว่าการเปลี่ยนแปลงโดยรวมดีขึ้น แย่ลง หรือใกล้เคียงเดิม
- ต้องระบุทั้งจุดที่ดีขึ้นและจุดที่แย่ลงในเชิง correctness, readability, efficiency, และความเสี่ยงต่อบั๊ก
```

**User message (ตัวอย่างโครงสร้าง):**

```text
<โหมด>
code-comparison
</โหมด>

<บริบทโจทย์จากระบบ>
{ProblemContext ที่ดึงจาก PDF / vector DB}
</บริบทโจทย์จากระบบ>

<โค้ดเวอร์ชันเก่า>
{old_code}
</โค้ดเวอร์ชันเก่า>

<โค้ดเวอร์ชันใหม่>
{new_code}
</โค้ดเวอร์ชันใหม่>

โปรด:
- เปรียบเทียบโค้ดเวอร์ชันเก่าและใหม่ว่าต่างกันอย่างไร
- ระบุว่าการเปลี่ยนแปลงโดยรวม "ดีขึ้น", "แย่ลง" หรือ "ใกล้เคียงเดิม"
- ระบุจุดที่ดีขึ้น (เช่น อ่านง่ายขึ้น เร็วขึ้น เคสครอบคลุมขึ้น)
- ระบุจุดที่แย่ลงหรือเสี่ยงเกิดบั๊ก
- ประเมินผลกระทบต่อ Big O ถ้ามี
```

---

## สรุปสำหรับทีม AI

- ใช้ **ภาษาไทยทั้งหมด** ใน system และ user message  
- ทุกโหมดต้องแนบ **ProblemContext จาก RAG** และถ้าเป็นไปได้ควรรวมเป้าหมาย Big O / constraints ของโจทย์เสมอ  
- แยกกติกาสำคัญไว้ใน **system message** เพื่อกันกรณีโมเดลละเมิด เช่น โหมด hint ห้ามให้โค้ด  
- ใช้โครงสร้าง `<โหมด>`, `<บริบทโจทย์จากระบบ>`, `<โค้ด...>`, `<คำถามของผู้เรียน>` ตามตัวอย่าง เพื่อให้ parsing และ debug ง่าย

ทีมสามารถนำตัวอย่างข้อความในเอกสารนี้ไปปรับใช้กับการเรียก `ollama.chat(messages=[...])` ได้โดยตรง เพียงแค่แทนที่ `{ProblemContext}`, `{student_question}`, `{student_code}`, `{old_code}`, `{new_code}` ด้วยข้อมูลจริงจากระบบ

---

## การใช้งานร่วมกับระบบเว็บแนว LeetCode (มี question_id)

ส่วนนี้อธิบายกรณีระบบมีฐานข้อมูลโจทย์เหมือน LeetCode และ frontend ส่งแค่ `question_id` + ข้อมูลจากผู้ใช้เข้ามา

### โครงสร้างข้อมูลโจทย์ (ตัวอย่าง mapping จาก DB)

จากตารางในระบบ (เช่น `questions`, `test_cases`, `submissions`, ฯลฯ) ให้ backend map field สำคัญมาใช้ใน prompt ดังนี้:

- **ข้อมูลจากตาราง `questions`**
  - `questions.id` หรือ `questions.code` → รหัสโจทย์
  - `questions.title` → ชื่อโจทย์
  - `questions.description` → เนื้อหาโจทย์หลัก
  - `questions.constraints` → เงื่อนไข/ข้อจำกัดของโจทย์
  - `questions.difficulty` → ระดับความยาก (easy / medium / hard)
  - `questions.expected_complexity` → expected time complexity (เช่น `O(N log N)`)
  - `questions.time_limit` → time limit ที่ระบบใช้รันกรณีจริง
  - `questions.memory_limit` → memory limit ที่ระบบใช้รันกรณีจริง
- **ข้อมูลเพิ่มเติมจาก PDF / RAG**
  - ใช้ `question_id` หาตำแหน่ง PDF ของโจทย์นั้น แล้วใช้ `rag_service` ดึง context เพิ่มเติมให้กลายเป็น `{ProblemContext}`

เมื่อ frontend ส่ง request เข้ามา ระบบไม่ต้องส่งเนื้อหาโจทย์มาจาก client ให้ backendดึงเองทั้งหมดด้วย `question_id` และใช้ข้อมูลเหล่านี้ประกอบ prompt ตามโหมดต่างๆ

---

## ตัวอย่างการทำงาน End-to-End (Flow ระดับระบบ)

ตัวอย่างนี้อิงกับ API 3 ตัวคล้ายในไฟล์ `main.py`:

- `/api/hint` – ขอคำใบ้ก่อนส่งโค้ด  
- `/api/analyze` – วิเคราะห์โค้ดที่ส่งมาแล้ว  
- `/api/compare` – เปรียบเทียบโค้ดเก่า-ใหม่

### 1) Flow โหมด Hint (Pre-submit)

**Input จากเว็บ (frontend)**  

- `question_id`
- `user_question` – ข้อสงสัยของผู้ทำโจทย์ (เป็นข้อความ)

**ขั้นตอนฝั่ง backend (แนวคิด):**

1. Query DB จาก `question_id` เพื่อดึง:
  - title, description, constraints, difficulty, expected_complexity, time_limit, memory_limit
2. หา path ของ PDF ตาม `question_id` แล้วเรียก `rag_service.get_context(...)` เพื่อดึง `{ProblemContext}` เพิ่ม (เนื้อหาจาก PDF ที่เกี่ยวข้อง)
3. ประกอบ **system message ภาษาไทย** ตามส่วน “โหมด 1: Pre-submit Hint” ในเอกสารนี้
4. ประกอบ **user message** ตามโครง:

```text
<โหมดการใช้งาน>
hint
</โหมดการใช้งาน>

<ข้อมูลโจทย์จากระบบ>
รหัสโจทย์: {questions.code หรือ questions.id}
หัวข้อ: {questions.title}
คำอธิบายโจทย์:
{questions.description}

ข้อจำกัด (constraints):
{questions.constraints}

ระดับความยาก: {questions.difficulty}
expected time complexity: {questions.expected_complexity}
time limit: {questions.time_limit} ms
memory limit: {questions.memory_limit} MB
</ข้อมูลโจทย์จากระบบ>

<บริบทเพิ่มเติมจาก PDF / vector DB>
{ProblemContext}
</บริบทเพิ่มเติมจาก PDF / vector DB>

<คำถามของผู้ทำโจทย์>
{user_question}
</คำถามของผู้ทำโจทย์>

โปรดตอบในรูปแบบ:
1. อธิบายแนวคิดหลักและโครงสร้างข้อมูลที่เหมาะสม
2. แนะนำขั้นตอนการแก้ปัญหาเป็นลำดับขั้น (ไม่ต้องลงดีเทลระดับโค้ด)
3. ระบุ time complexity และ space complexity คร่าวๆ ของแนวทางที่แนะนำ
4. หลีกเลี่ยงการเขียนโค้ดเฉลยในภาษาโปรแกรมจริง (อนุญาต pseudo-code ระดับสูงเฉพาะเมื่อจำเป็น)
5. ให้กำลังใจและชวนให้ผู้ทำโจทย์ลองเขียนโค้ดเอง
```

1. เรียก `ollama.chat` หรือโมเดลอื่น โดยส่ง `messages = [system_message, user_message]`
2. ส่งคำตอบของโมเดลกลับไปที่ frontend ในรูปแบบ JSON เช่น `{ "hint": "<ข้อความคำใบ้จาก AI>" }`

---

### 2) Flow โหมด Analyze (Post-submit)

**Input จากเว็บ**

- `question_id`
- `user_code` – โค้ดที่ผู้ทำโจทย์ส่งมา (string)

**ขั้นตอนฝั่ง backend:**

1. Query DB จาก `question_id` ดึงข้อมูลโจทย์เหมือนโหมด hint
2. ดึง `{ProblemContext}` จาก PDF ผ่าน `rag_service.get_context(question_title หรือ question_description)`
3. สร้าง system message ตาม “โหมด 2: Post-submit Analysis”
4. สร้าง user message:

```text
<โหมดการใช้งาน>
analyze
</โหมดการใช้งาน>

<ข้อมูลโจทย์จากระบบ>
รหัสโจทย์: {questions.code หรือ questions.id}
หัวข้อ: {questions.title}
คำอธิบายโจทย์:
{questions.description}

ข้อจำกัด (constraints):
{questions.constraints}

ระดับความยาก: {questions.difficulty}
expected time complexity: {questions.expected_complexity}
time limit: {questions.time_limit} ms
memory limit: {questions.memory_limit} MB
</ข้อมูลโจทย์จากระบบ>

<บริบทเพิ่มเติมจาก PDF / vector DB>
{ProblemContext}
</บริบทเพิ่มเติมจาก PDF / vector DB>

<โค้ดของผู้ทำโจทย์>
{user_code}
</โค้ดของผู้ทำโจทย์>

โปรดตอบในรูปแบบ:
1. สรุปสั้นๆ ว่าโค้ดนี้แก้โจทย์ได้ถูกต้องตามเงื่อนไขหรือไม่ (รวมถึง edge cases สำคัญ)
2. ระบุจุดแข็งของโค้ดนี้
3. ระบุจุดที่ควรปรับปรุง (เช่น ความซับซ้อนสูงไป, อ่านยาก, handle เคสไม่ครบ)
4. ประเมิน time complexity และ space complexity ของโค้ดปัจจุบัน และเปรียบเทียบกับ expected time complexity ที่กำหนดในข้อมูลโจทย์
5. หากมีแนวทางหรือโค้ดที่ดีกว่า ให้ยกตัวอย่างพร้อมอธิบายว่าดีกว่าตรงไหน
```

1. เรียกโมเดลด้วย `messages = [system_message, user_message]`
2. ส่งคืน response เช่น `{ "analysis": "<สรุปจาก AI>" }`

---

### 3) Flow โหมด Compare (เปรียบเทียบโค้ดเก่า/ใหม่)

**Input จากเว็บ**

- `question_id`
- `old_code`
- `new_code`

**ขั้นตอนฝั่ง backend:**

1. Query DB จาก `question_id` เพื่อดึงข้อมูลโจทย์เหมือนเดิม
2. ดึง `{ProblemContext}` จาก PDF ผ่าน RAG
3. ตั้ง system message ตาม “โหมด 3: Code Comparison”
4. ตั้ง user message:

```text
<โหมดการใช้งาน>
compare
</โหมดการใช้งาน>

<ข้อมูลโจทย์จากระบบ>
รหัสโจทย์: {questions.code หรือ questions.id}
หัวข้อ: {questions.title}
คำอธิบายโจทย์:
{questions.description}

ข้อจำกัด (constraints):
{questions.constraints}

ระดับความยาก: {questions.difficulty}
expected time complexity: {questions.expected_complexity}
time limit: {questions.time_limit} ms
memory limit: {questions.memory_limit} MB
</ข้อมูลโจทย์จากระบบ>

<บริบทเพิ่มเติมจาก PDF / vector DB>
{ProblemContext}
</บริบทเพิ่มเติมจาก PDF / vector DB>

<โค้ดเวอร์ชันเก่า>
{old_code}
</โค้ดเวอร์ชันเก่า>

<โค้ดเวอร์ชันใหม่>
{new_code}
</โค้ดเวอร์ชันใหม่>

โปรดตอบในรูปแบบ:
1. สรุปโดยรวมว่าเวอร์ชันใหม่ "ดีขึ้น", "แย่ลง" หรือ "ใกล้เคียงเดิม"
2. ระบุสิ่งที่ดีขึ้นในเวอร์ชันใหม่ (เช่น correctness, readability, time/space complexity, ความยืดหยุ่น)
3. ระบุสิ่งที่แย่ลงหรือเสี่ยงเกิดบั๊กมากขึ้น
4. เปรียบเทียบ time complexity และ space complexity ระหว่างเวอร์ชันเก่าและใหม่
5. ให้คำแนะนำเชิงรูปธรรมว่าควรปรับเวอร์ชันใหม่อย่างไรให้ดีกว่าเดิมอย่างชัดเจน
```

1. เรียกโมเดลด้วย `messages = [system_message, user_message]`
2. ส่งคืน response เช่น `{ "comparison": "<ผลการเปรียบเทียบจาก AI>" }`

---

## สรุป Flow สำหรับทีมพัฒนา

- Frontend ส่งแค่ `question_id` + ข้อมูลที่ผู้ใช้กรอก/โค้ดจริง  
- Backend ใช้ `question_id` ไปดึงข้อมูลโจทย์จาก DB + PDF → ประกอบ `{ProblemContext}` และ metadata ทั้งหมด  
- Backend ประกอบ system/user message ตาม template ภาษาไทยในเอกสารนี้ แยกตามโหมด `hint / analyze / compare`  
- เรียกโมเดลด้วย `messages = [system, user]` แล้วส่งคำตอบกลับไปยัง frontend เป็น JSON

ด้วยโครงนี้ prompt จะ:

- รู้ว่าโจทย์คืออะไร  
- รู้แนวทาง/complexity ที่ระบบคาดหวัง  
- มีข้อมูลคำถาม/โค้ดของผู้ทำโจทย์ชัดเจน  
- และให้คำตอบในกรอบที่ควบคุมได้ตามกติกาที่กำหนดไว้ใน system message

