# 🌿 PlantKeeper
> A smart, elegant app for plant lovers to track, care for, and explore their personal plant collection.
 
<img src="https://github.com/user-attachments/assets/8be62da3-00e0-472e-9fa5-6b489729b7d1" width="150" />
<img src="https://github.com/user-attachments/assets/1618e774-a1d2-4e1e-af54-e2fc42875db2" width="150" />
<img src="https://github.com/user-attachments/assets/6dec72b5-6b80-42d9-a6fe-d88bdbf3f3a4" width="150" />


## 🚀 Features
* **Personal Plant Collection** - Users can view and manage their saved plants with beautiful visuals.
* **Plant Scanner & Identifier** - Identify new plants and get care instructions (via future camera input or modal).
* **Care Instructions Database** - Each plant is linked to detailed, user-friendly care info — including sunlight, watering frequency, humidity, and more.
* **User Authentication (Firebase)** - Login & registration powered by Firebase Auth. Personalized plant lists are stored per user.
* **Realtime Database Integration** - Firebase Firestore stores all user data, plant metadata, and care information.
* **Responsive UI + Bottom Navigation Bar** - Mobile-first interface with modern icons, rounded cards, and smooth UX.

## 🧠 Model Architecture
PlantKeeper uses a **YOLOv5-based model** trained on a curated dataset of houseplants to detect and classify species from user images.

🔗 Model GitHub: [coralen/plant-recognition](https://github.com/coralen/plant-recognition)
* Built on YOLOv5
* Supports real-time image classification
* Trained on 10 common indoor plant species
* Outputs bounding boxes and predicted species

![image](https://github.com/user-attachments/assets/181c6563-9baf-4568-8b8b-520b1bb79c07)
![image](https://github.com/user-attachments/assets/f63547db-d90e-448c-ae64-eadfa255450f)

## Currently Supported Plant Species
The model can classify the following plants:

* Aloe Vera
* Tradescantia
* Snake plant (Sanseviera)
* Peace lily
* Orchid
* Monstera Deliciosa
* Echeveria
* Ctenanthe
* Chinese Money Plant
* African Violet
