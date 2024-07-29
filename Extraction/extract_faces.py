import cv2
import glob
import os


face_cascade=cv2.CascadeClassifier('model\haarcascade_frontalface_default.xml')

path = 'faces/*.jpg'

output_dir = "extracted_faces"
os.makedirs(output_dir, exist_ok=True)


img_number = 1

img_list = glob.glob(path)

for file in img_list :
    img = cv2.imread(file, 1)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    if len(faces) == 0:
        print(f"No faces detected in {file}")
    else:
        for (x, y, w, h) in faces:
            # Extract the face
            roi_color = img[y:y + h, x:x + w]

            # Resize the extracted face
            resized = cv2.resize(roi_color, (128, 128))

            # Save the extracted face
            output_file = os.path.join(output_dir, f"{img_number}.jpg")
            cv2.imwrite(output_file, resized)
            print(f"Saved face {img_number} from {file} as {output_file}")

            # Increment the image number
            img_number += 1