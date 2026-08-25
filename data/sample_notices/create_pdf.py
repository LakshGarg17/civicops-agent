def create_sample_pdf(filepath: str):
    header = b"%PDF-1.4\n"
    obj1 = b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    obj2 = b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    obj3 = b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n"
    obj4 = b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n"
    obj5 = b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    
    stream_content = (
        b"BT\n"
        b"/F1 16 Tf\n"
        b"50 720 Td (COUNTY OF KINGS - OFFICE OF THE TAX COLLECTOR) Tj\n"
        b"0 -25 Td /F1 13 Tf (FINAL NOTICE OF DELINQUENT PROPERTY TAX) Tj\n"
        b"0 -28 Td /F2 10 Tf (Date of Notice: October 15, 2024) Tj\n"
        b"0 -16 Td (Parcel Identification / APN: 4920-038-012) Tj\n"
        b"0 -16 Td (Assessee / Citizen Name: Jane Doe & John Doe) Tj\n"
        b"0 -16 Td (Property Location: 742 Evergreen Terrace, Kings County) Tj\n"
        b"0 -24 Td /F1 11 Tf (TOTAL DELINQUENT AMOUNT DUE: $4,911.25) Tj\n"
        b"0 -18 Td /F2 10 Tf (Statutory Due Date / Deadline: NOVEMBER 30, 2024) Tj\n"
        b"0 -24 Td /F1 11 Tf (ISSUE & STATUTORY NOTICE:) Tj\n"
        b"0 -16 Td /F2 10 Tf (The second installment of real property tax for fiscal year 2023-2024 remains unpaid.) Tj\n"
        b"0 -14 Td (Under State Revenue & Taxation Code Section 3351, statutory lien attachment will proceed.) Tj\n"
        b"0 -24 Td /F1 11 Tf (REQUIRED ACTIONS:) Tj\n"
        b"0 -16 Td /F2 10 Tf (1. Remit full payment of $4,911.25 via kingscounty.gov/taxes or cashier check.) Tj\n"
        b"0 -14 Td (2. Submit Dispute Form TC-409 with required evidence within 30 days if contested.) Tj\n"
        b"0 -24 Td /F1 11 Tf (MENTIONED SUPPORTING DOCUMENTS:) Tj\n"
        b"0 -16 Td /F2 10 Tf (- Dispute Form TC-409) Tj\n"
        b"0 -14 Td (- Proof of prior tax payment or canceled check) Tj\n"
        b"0 -14 Td (- Recorded Grant Deed / Proof of Ownership) Tj\n"
        b"ET\n"
    )
    
    obj6 = b"6 0 obj\n<< /Length " + str(len(stream_content)).encode("ascii") + b" >>\nstream\n" + stream_content + b"endstream\nendobj\n"
    
    offsets = [0]
    curr = len(header)
    for obj in [obj1, obj2, obj3, obj4, obj5, obj6]:
        offsets.append(curr)
        curr += len(obj)
        
    xref = b"xref\n0 7\n0000000000 65535 f \n"
    for o in offsets[1:]:
        xref += f"{o:010d} 00000 n \n".encode("ascii")
        
    trailer = b"trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n" + str(curr).encode("ascii") + b"\n%%EOF\n"
    
    full_pdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + obj6 + xref + trailer
    with open(filepath, "wb") as f:
        f.write(full_pdf)

if __name__ == "__main__":
    import os
    target = os.path.join("data", "sample_notices", "property_tax_notice.pdf")
    os.makedirs(os.path.dirname(target), exist_ok=True)
    create_sample_pdf(target)
    print("Created clean sample PDF at:", target)
