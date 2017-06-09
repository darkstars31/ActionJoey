import * as Assets from '../assets';

export default class Title extends Phaser.State {
    private backgroundTemplateSprite: Phaser.Sprite = null;
    private googleFontText: Phaser.Text = null;
    private scoreText: Phaser.Text = null;
    private playerScore: number = 0;
    
    private sfxAudiosprite: Phaser.AudioSprite = null;
    private actionJoey: Phaser.Sprite = null;
    private bullet: Phaser.Sprite = null;
    private shotgun: Phaser.Sprite = null;
    private actionJoeyDirection = false;
    private actionJoeyModel = {
        direction: false,
        moveSpeed: 1.5,
    };

    // Define constants
    private SHOT_DELAY = 80; // milliseconds (10 bullets/second)
    private BULLET_SPEED = 600; // pixels/second
    private NUMBER_OF_BULLETS = 100;
    private lastBulletShotAt = 0;
    private bulletPool = null;
    private enemyPool = null;

    // This is any[] not string[] due to a limitation in TypeScript at the moment;
    // despite string enums working just fine, they are not officially supported so we trick the compiler into letting us do it anyway.
    private sfxLaserSounds: any[] = null;

    public create(): void {
        this.backgroundTemplateSprite = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesE46ae3d48f6ddefd39a87cfa8f941d45.getName());
        this.backgroundTemplateSprite.anchor.setTo(0.5);
        this.backgroundTemplateSprite.scale.setTo(.5,.5);

        this.googleFontText = this.game.add.text(this.game.world.width /3, this.game.world.y + 40, 'ACTION JOEY', {
            font: '36px ' + Assets.GoogleWebFonts.AllertaStencil
        });
        this.scoreText = this.game.add.text(this.game.world.width - 200, this.game.world.y + 40, "Bugs Sqwished: " +  this.playerScore.toString(), {
            font: '16px ' + Assets.GoogleWebFonts.AllertaStencil
        });
        this.googleFontText.anchor.setTo(0.5);

        
        this.bulletPool = this.game.add.group();
        this.enemyPool = this.game.add.group();

        for(var i = 0; i < 20; i++) {
            var bug = this.game.add.sprite(0,0, Assets.Images.ImagesBug.getName());
            this.enemyPool.add(bug);
            bug.anchor.setTo(.5,.5);
            bug.scale.setTo(.1,.1);
            this.game.physics.enable(bug, Phaser.Physics.ARCADE);
            bug.kill();
        }
       
        for(var i = 0; i < this.NUMBER_OF_BULLETS; i++) {
             var b = this.game.add.sprite(0, 0, Assets.Images.ImagesBulletPng12.getName());
             this.bulletPool.add(b);
             b.anchor.setTo(.5,.5);
             b.scale.setTo(.5,.5);
             this.game.physics.enable(b, Phaser.Physics.ARCADE);
             b.kill();
        }
        
        this.actionJoey = this.game.add.sprite(this.game.world.centerX, this.game.height - 50, Assets.Spritesheets.SpritesheetsActionjoeyspritesheet.getName());
        this.actionJoey.animations.add('walk');
        this.actionJoey.animations.play('walk', 12, true);
        this.actionJoey.animations.stop();
        this.actionJoey.anchor.setTo(.5,.5);

        this.shotgun = this.game.add.sprite(null, null, Assets.Images.ImagesShotgun.getName());
        this.shotgun.anchor.setTo(.08, .7);


        this.game.input.keyboard.addKeyCapture(
            [ 38, 40, 37, 39, 65, 68, 83]
        );

        this.sfxAudiosprite = this.game.add.audioSprite(Assets.Audiosprites.AudiospritesSfx.getName());

        // This is an example of how you can lessen the verbosity
        let availableSFX = Assets.Audiosprites.AudiospritesSfx.Sprites;
        this.sfxLaserSounds = [
            availableSFX.Laser1,
            availableSFX.Laser2,
            availableSFX.Laser3,
            availableSFX.Laser4,
            availableSFX.Laser5,
            availableSFX.Laser6,
            availableSFX.Laser7,
            availableSFX.Laser8,
            availableSFX.Laser9
        ];

        //this.game.sound.play(Assets.Audio.AudioMusic.getName(), 0.2, true);

        this.backgroundTemplateSprite.inputEnabled = true;   

        this.game.camera.flash(0x000000, 1000);
    }

    public update(): void  {
        var isMoving = false;
        this.shotgun.position.x = this.actionJoey.position.x;
        this.shotgun.position.y = this.actionJoey.position.y + 10;
        this.shotgun.rotation = this.game.physics.arcade.angleToPointer(this.shotgun);

// Player Movement
        if(this.input.keyboard.isDown(87)) {
            
            if(!this.actionJoeyModel.direction){
                this.actionJoeyModel.direction = true;             
                this.flipYSprite(this.shotgun);                
                this.flipSprite(this.actionJoey);
                
            }
                
            this.actionJoey.position.x -= this.actionJoeyModel.moveSpeed;
            isMoving = true;
        }
        if(this.input.keyboard.isDown(83)) {
            
            if(!this.actionJoeyModel.direction){
                this.actionJoeyModel.direction = true;             
                this.flipYSprite(this.shotgun);                
                this.flipSprite(this.actionJoey);
                
            }
                
            this.actionJoey.position.x -= this.actionJoeyModel.moveSpeed;
            isMoving = true;
        }
        if(this.leftInputIsActive() || this.input.keyboard.isDown(65)) {
            
            if(!this.actionJoeyModel.direction){
                this.actionJoeyModel.direction = true;             
                this.flipYSprite(this.shotgun);                
                this.flipSprite(this.actionJoey);
            }
                
            this.actionJoey.position.x -= this.actionJoeyModel.moveSpeed;
            isMoving = true;    
        }
        if(this.rightInputIsActive() || this.input.keyboard.isDown(68)) {
             if(this.actionJoeyModel.direction){
                this.actionJoeyModel.direction = false;                    
                this.flipYSprite(this.shotgun);        
                this.flipSprite(this.actionJoey);
            }
                
            this.actionJoey.position.x += this.actionJoeyModel.moveSpeed;
            isMoving = true;
        }

        if(this.input.activePointer.isDown) {
            this.fireBullet();
            this.scoreText.setText('Bugs Sqwished: ' + this.playerScore.toString());
        }

        this.generateEnemies();

        if(isMoving){
            this.actionJoey.animations.play('walk');
        } else {
            this.actionJoey.animations.stop();
        }
       
        this.game.physics.arcade.overlap(this.bulletPool, this.enemyPool, this.collisionHandler, null, this);

    }

    public collisionHandler(bullet, enemy): void {
        bullet.kill();
        enemy.kill();

        this.playerScore += 1;
    }

    public generateEnemies(): void {

        var enemy = this.enemyPool.getFirstDead();
        if (enemy === null || enemy === undefined) return;
        enemy.revive();
        enemy.checkWorldBounds = true;
        enemy.outOfBoundsKill = true;
        enemy.reset(Math.random() * (this.game.width - 10), 10);

        enemy.body.velocity.y += 50;

        if(enemy.position.y > this.game.height - 40) {
            alert("Game Over");
        }
    }

    public fireBullet(): void {      
        if (this.game.time.now - this.lastBulletShotAt < this.SHOT_DELAY) return;
        this.lastBulletShotAt = this.game.time.now;

        // Get a dead bullet from the pool
        var bullet = this.bulletPool.getFirstDead();

        // If there aren't any bullets available then don't shoot
        if (bullet === null || bullet === undefined) return;

        bullet.revive();

        bullet.checkWorldBounds = true;
        bullet.outOfBoundsKill = true;

        // Set the bullet position to the gun position.
        bullet.reset(this.shotgun.position.x, this.shotgun.position.y);       
        bullet.rotation = this.shotgun.rotation;
        bullet.body.velocity.x = Math.cos(bullet.rotation) * this.BULLET_SPEED;
        bullet.body.velocity.y = Math.sin(bullet.rotation) * this.BULLET_SPEED;
        //this.sfxAudiosprite.play(Phaser.ArrayUtils.getRandomItem(this.sfxLaserSounds));
      
    }

    public flipSprite(sprite): void {
        sprite.scale.x = sprite.scale.x * -1;
    }

    public flipYSprite(sprite): void {
        sprite.scale.y = sprite.scale.y * -1;
    }

    public leftInputIsActive(): any {
        var isActive = false;
        isActive = this.input.keyboard.isDown(Phaser.Keyboard.LEFT || Phaser.Keyboard.A);
        return isActive;
    }
    public rightInputIsActive(): any {
        var isActive = false;
        isActive = this.input.keyboard.isDown(Phaser.Keyboard.RIGHT || Phaser.Keyboard.D);
        return isActive;
    }
}
